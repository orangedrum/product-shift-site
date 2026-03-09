import { GoogleGenerativeAI, ModelParams } from '@google/generative-ai';
import { delay } from './services';

let cachedModels: ModelParams[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

/**
 * Fetches and caches the list of available models from the Gemini API.
 * This makes the application resilient to external model name changes.
 */
const getAvailableModels = async (genAI: GoogleGenerativeAI): Promise<{ models: ModelParams[], source: 'cache' | 'live' | 'fallback' }> => {
  // CTO DIAGNOSTIC: The dynamic listModels() function was removed by the library vendor, causing a crash.
  // We are temporarily using a minimal, stable list to confirm if ANY model connection is possible.
  // This will isolate the problem to either our code or the Google Cloud project configuration.
  console.log('[AI Service] Using minimal stable model list for diagnostics.');
  const stableModels = [
      // CTO DIAGNOSTIC: The logs show 404s for all modern models. We will try the oldest stable models.
      // If these also fail, the issue is 100% with the Google Cloud Project configuration.
      { name: 'models/gemini-pro-vision', supportedGenerationMethods: ['generateContent'] } as any, // Still the primary for images
      { name: 'models/gemini-1.0-pro', supportedGenerationMethods: ['generateContent'] } as any, // A stable text-only fallback
  ];

  cachedModels = stableModels;

  return { models: cachedModels, source: 'fallback' };
};

export const generateContentWithFallback = async (prompt: string, screenshot?: string): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing in environment variables");
  
  const genAI = new GoogleGenerativeAI(apiKey);
  let errorLog: string[] = [];
  
  const { models: allModels } = await getAvailableModels(genAI);
  
  const modelsToTry = allModels
    .map((m: any) => m.name?.replace('models/', '') || '')
    .filter(name => {
      // Updated Filter: Gemini 1.5 and 2.0 are multimodal (text + images).
      // We must ensure they are included for vision tasks.
      const isVisionSupported = name.includes('vision') || name.includes('flash') || name.includes('1.5') || name.includes('2.0');
      
      if (screenshot) {
        return isVisionSupported;
      } else {
        // For text-only, avoid legacy 'vision' specific models, but allow flash/1.5/2.0
        return !name.includes('vision');
      }
    })
    .sort((a, b) => {
        // CTO DIAGNOSTIC: Forcing the priority to match our minimal test list.
        const priority = ['gemini-pro-vision', 'gemini-1.0-pro'];
        return (priority.indexOf(a) === -1 ? 99 : priority.indexOf(a)) - (priority.indexOf(b) === -1 ? 99 : priority.indexOf(b));
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
  
  // --- CTO DIAGNOSTIC ---
  // We will perform a direct, simple API call to definitively test the API key and project configuration.
  // This bypasses our complex scavenger logic to get a clear signal.
  try {
    // CTO DIAGNOSTIC: The error "'gemini-pro' is not found for API version v1beta" suggests the model name is wrong for the API endpoint.
    // We are now using an older, more stable model name ('gemini-1.0-pro') for the health check.
    const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
    await model.countTokens("test"); // A lightweight, inexpensive call to check connectivity.

    // If the above call succeeds, we know the API key and project are configured correctly.
    // Now we can proceed with our normal dynamic model fetching.
    const { models, source } = await getAvailableModels(genAI);
    let message = '';
    switch(source) {
        case 'live':
            message = 'Successfully connected to Google AI and fetched live model list.';
            break;
        case 'cache':
            message = 'Using cached model list.';
            break;
        case 'fallback':
            message = 'Failed to fetch model list, using hardcoded fallback.';
            break;
    }
    return {
      status: source === 'fallback' ? 'degraded' : 'ok',
      message,
      source,
      models: models.map(m => m.name),
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