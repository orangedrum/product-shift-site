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
  const now = Date.now();
  if (cachedModels && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)) {
    return { models: cachedModels, source: 'cache' };
  }

  console.log('[AI Service] Cache stale or empty. Fetching available models from Google...');
  try {
    const result = await genAI.listModels();

    const availableModels = result.models.filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'));
    
    cachedModels = availableModels;
    cacheTimestamp = now;
    
    console.log('[AI Service] Fetched and cached models:', availableModels.map(m => m.name));
    return { models: availableModels, source: 'live' };
  } catch (error) {
    console.error('[AI Service] Failed to fetch model list from Google. Falling back to hardcoded list.', error);
    const fallbackModels = [
        { name: 'models/gemini-1.5-flash', supportedGenerationMethods: ['generateContent'] } as any,
        { name: 'models/gemini-flash-latest', supportedGenerationMethods: ['generateContent'] } as any,
        { name: 'models/gemini-1.5-pro', supportedGenerationMethods: ['generateContent'] } as any,
    ];

    // RESILIENCY FIX: Cache the fallback list to prevent repeated failed calls and timeouts.
    // This makes the app stable even if the build environment has stale dependencies.
    cachedModels = fallbackModels;
    cacheTimestamp = now;

    return { models: fallbackModels, source: 'fallback' };
  }
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
        const priority = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-flash-latest', 'gemini-pro-vision'];
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
          message = 'Failed to connect to Google AI, using hardcoded fallback list.';
          break;
  }

  return {
    status: source === 'fallback' ? 'degraded' : 'ok',
    message,
    source,
    models: models.map(m => m.name),
    cacheTimestamp: cacheTimestamp ? new Date(cacheTimestamp).toISOString() : null,
  };
};