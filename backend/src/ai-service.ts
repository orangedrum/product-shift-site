import { GoogleGenerativeAI, ModelParams } from '@google/generative-ai';
import { delay } from './services';

let cachedModels: ModelParams[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

/**
 * Fetches and caches the list of available models from the Gemini API.
 * This makes the application resilient to external model name changes.
 */
const getAvailableModels = async (apiKey: string): Promise<{ models: ModelParams[], source: 'cache' | 'live' | 'fallback' }> => {
  const now = Date.now();
  if (cachedModels && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)) {
    return { models: cachedModels, source: 'cache' };
  }

  console.log('[AI Service] Smart Scavenger: Querying Google REST API for available models...');
  try {
    // Direct REST call to bypass SDK versioning issues and get the ground truth for this API Key
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    
    if (!response.ok) {
      throw new Error(`Google API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Filter for models that support content generation and map to the SDK's expected format
    // CTO FIX: The previous mapping was incorrect, causing `null` models. The API returns objects with a `name` property. We should return these directly.
    const availableModels = (data.models || [])
      .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'));

    if (availableModels.length === 0) throw new Error('No models found with generateContent support');

    cachedModels = availableModels;
    cacheTimestamp = now;
    
    console.log('[AI Service] Scavenger Success. Found models:', availableModels.map((m: any) => m.name));
    return { models: availableModels, source: 'live' };
  } catch (error) {
    console.error('[AI Service] Scavenger failed. Falling back to hardcoded list.', error);
    
    // Robust Fallback: A mix of legacy and new model names to maximize hit rate
    const fallbackModels = [
        { name: 'models/gemini-1.5-flash-latest' },
        { name: 'models/gemini-pro' },
        { name: 'models/gemini-pro-vision' },
        { name: 'models/gemini-1.0-pro' }
    ] as any;

    cachedModels = fallbackModels;
    cacheTimestamp = now;

    return { models: fallbackModels, source: 'fallback' };
  }
};

export const generateContentWithFallback = async (prompt: string, screenshot?: string): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing in environment variables");

  // CTO DIAGNOSTIC: Masked Key Log to verify ground truth in Vercel
  const maskedKey = `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
  console.log(`[AI Service] Starting generation. Key: ${maskedKey}`);
  
  const genAI = new GoogleGenerativeAI(apiKey);
  let errorLog: string[] = [];
  
  const { models: allModels } = await getAvailableModels(apiKey);
  
  const modelsToTry = allModels
    .map((m: any) => m.name?.replace('models/', '') || '')
    .filter(name => {
      // CTO FIX: The models list in 2026 is returning massive amounts of noise (nano, preview, robotics, etc.)
      // that are often restricted or unstable. We must aggressively filter for standard, high-reliability models.
      const isNoise = name.includes('preview') || 
                      name.includes('tts') || 
                      name.includes('image') || 
                      name.includes('robotics') || 
                      name.includes('nano') || 
                      name.includes('banana') || 
                      name.includes('gemma') || 
                      name.includes('lyria') || 
                      name.includes('deep-research') ||
                      name.includes('banana');
      
      if (isNoise) return false;

      const isMultimodal = name.includes('flash') || name.includes('1.5') || name.includes('2.0') || name.includes('2.5');
      const isVisionSupported = name.includes('vision') || isMultimodal;

      if (screenshot) {
        return isVisionSupported;
      } else {
        // For text-only, avoid legacy 'vision' specific models
        const isLegacyVision = name.includes('vision') && !isMultimodal;
        return !isLegacyVision;
      }
    })
    .sort((a, b) => {
        // CTO FIX: Update priority list for 2026 model naming conventions.
        // We prefer Flash for speed, falling back to Pro for reasoning depth.
        const priority = [
            'gemini-1.5-flash', 
            'gemini-1.5-pro',
            'gemini-flash-latest', 
            'gemini-1.5-flash-latest', 
            'gemini-2.0-flash',
            'gemini-pro-latest', 
            'gemini-pro'
        ];
        
        // Find the best match index (Exact match or very close alias)
        const scoreA = priority.findIndex(p => a === p || a === `models/${p}`);
        const scoreB = priority.findIndex(p => b === p || b === `models/${p}`);
        
        const finalA = scoreA === -1 ? 999 : scoreA;
        const finalB = scoreB === -1 ? 999 : scoreB;

        return finalA - finalB;
    });

  if (modelsToTry.length === 0) {
      throw new Error('No suitable AI models found for this request type (text vs. vision).');
  }

  // Prepare image part if available
  const imagePart = screenshot ? {
    inlineData: {
      data: screenshot,
      mimeType: "image/jpeg",
    },
  } : null;

  const parts: any[] = [prompt];
  if (imagePart) parts.push(imagePart);

  let attempt = 0;
  for (const modelName of modelsToTry) {
    try {
      attempt++;
      console.log(`[AI Service] Attempting generation with model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(parts);
      const response = result.response;
      console.log(`✅ Model '${modelName}' succeeded.`);
      return response.text();
    } catch (error: any) {
      // CTO DIAGNOSTIC: Specific 403 handling
      if (error.message.includes('403') || error.message.includes('Forbidden')) {
        const permMsg = `🚨 [PERMISSIONS ERROR] Project denied access to ${modelName}. ACTION REQUIRED: 1. Go to https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com and click ENABLE. 2. Check https://console.cloud.google.com/apis/credentials to ensure the key is not restricted.`;
        console.error(permMsg);
        // CTO FIX: Stop retrying on configuration errors. This prevents 58s timeouts.
        throw new Error(permMsg);
      }

      if (error.message.includes('503') || error.message.includes('429')) {
        const waitTime = 1000 * Math.pow(2, attempt); // 2s, 4s...
        console.log(`[AI Service] Model busy. Waiting ${waitTime}ms before next attempt.`);
        await delay(waitTime);
      }
      console.log(`Model '${modelName}' failed: ${error.message}`);
      if (error.message.includes('404') && error.message.includes('not found')) {
        errorLog.push(`${modelName}: 404 (Check API Key/Enabled Services)`);
      } else if (error.message.includes('429')) {
        errorLog.push(`${modelName}: 429 Rate Limit Exceeded`);
      } else {
        errorLog.push(`${modelName}: ${error.message}`);
      }
    }
  }

  throw new Error(`All fallback models failed. Errors: ${errorLog.join(' | ')}`);
};

export const generateEnhancedContent = async (expertReport: string, userSessions: any[], title: string): Promise<{ blogContent: string, excerpt: string }> => {
  const excerptPrompt = `
    You are an SEO expert. Based on the following UX audit summary, write a concise, compelling, and keyword-rich meta description of no more than 160 characters.
    Audit Title: "${title}"
    Summary: ${expertReport.substring(0, 500)}
  `;
  const excerpt = await generateContentWithFallback(excerptPrompt);

  const blogContentPrompt = `
    You are a content writer specializing in UX and technology. Your task is to transform a raw AI-generated UX audit into a well-structured and engaging blog post.

    **Instructions:**
    1.  Write a brief, compelling introduction (2-3 sentences) that hooks the reader by stating the website being audited and the key takeaway from the audit.
    2.  Present the "Expert Analysis" section clearly.
    3.  Integrate the "User Feedback" smoothly, perhaps under a heading like "What Real Users Thought".
    4.  Conclude with a short summary of the findings and a call to action for readers to get their own audit.
    5.  The tone should be professional, insightful, and easy to read.

    **Raw Data:**
    ${JSON.stringify({ expertReport, userSessions }, null, 2)}
  `;
  const blogContent = await generateContentWithFallback(blogContentPrompt);
  return { blogContent, excerpt: excerpt.replace(/"/g, '') };
};

export const getAiServiceStatus = async () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      status: 'error',
      message: 'GEMINI_API_KEY is missing.',
      source: 'not_configured',
      models: [],
      cacheTimestamp: null,
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    // Use the smart scavenger to check health. If it returns models, we are good.
    const { models, source } = await getAvailableModels(apiKey);
    let message = '';
    switch(source) {
        case 'live':
            message = 'Successfully connected to Google AI and fetched live model list.';
            break;
        case 'cache':
            message = 'Using cached model list.';
            break;
        case 'fallback':
            message = 'Failed to connect to Google AI model list, using hardcoded fallback.';
            break;
    }
    return {
      status: source === 'fallback' ? 'degraded' : 'ok',
      message,
      source,
      models: models.map((m: any) => m.name),
      cacheTimestamp: cacheTimestamp ? new Date(cacheTimestamp).toISOString() : null,
    };

  } catch (error: any) {
    let errorMessage = `A generic error occurred: ${error.message}`;
    if (error.message.includes('API key not valid')) {
      errorMessage = 'CRITICAL: The GEMINI_API_KEY is invalid or has been revoked.';
    } else if (error.message.includes('permission to access') || error.message.includes('Access Not Configured')) {
      errorMessage = 'ACTION REQUIRED: The "Generative Language API" is not enabled for your Google Cloud project, or your project is suspended due to a billing issue. Please check your Google Cloud Console.';
    }
    
    return { status: 'error', message: errorMessage, source: 'diagnostic_failure', models: [], cacheTimestamp: null };
  }
};