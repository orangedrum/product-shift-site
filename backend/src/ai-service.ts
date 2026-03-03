import { GoogleGenerativeAI, ModelParams } from '@google/generative-ai';
import { delay } from './services';

let cachedModels: ModelParams[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

/**
 * Fetches and caches the list of available models from the Gemini API.
 * This makes the application resilient to external model name changes.
 */
const getAvailableModels = async (genAI: GoogleGenerativeAI): Promise<ModelParams[]> => {
  const now = Date.now();
  if (cachedModels && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)) {
    return cachedModels;
  }

  console.log('[AI Service] Cache stale or empty. Fetching available models from Google...');
  try {
    const result = await genAI.listModels();
    const availableModels = result.models.filter(m => m.supportedGenerationMethods.includes('generateContent'));
    
    cachedModels = availableModels;
    cacheTimestamp = now;
    
    console.log('[AI Service] Fetched and cached models:', availableModels.map(m => m.name));
    return availableModels;
  } catch (error) {
    console.error('[AI Service] Failed to fetch model list from Google. Falling back to hardcoded list.', error);
    return [
        { name: 'models/gemini-1.5-flash', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/gemini-1.5-pro', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/gemini-pro', supportedGenerationMethods: ['generateContent'] },
    ] as ModelParams[];
  }
};

export const generateContentWithFallback = async (prompt: string, screenshot?: string): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing in environment variables");
  
  const genAI = new GoogleGenerativeAI(apiKey);
  let errorLog: string[] = [];

  const allModels = await getAvailableModels(genAI);

  const modelsToTry = allModels
    .map(m => m.name.replace('models/', ''))
    .filter(name => {
      // DEDUCTION: 1.5 models are multimodal (text+image). 'vision' models are explicit.
      // If we have a screenshot, we MUST use a model that supports it.
      const isVisionCapable = name.includes('vision') || name.includes('1.5') || name.includes('flash');
      
      return screenshot ? isVisionCapable : true;
    })
    .sort((a, b) => {
        // Prioritize the models we prefer if they are available
        const priority = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro', 'gemini-pro-vision'];
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

  for (const modelName of modelsToTry) {
    try {
      console.log(`[AI Service] Attempting generation with model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(parts);
      const response = result.response;
      console.log(`✅ Model '${modelName}' succeeded.`);
      return response.text();
    } catch (error: any) {
      // If 503 (Service Unavailable) or 429 (Too Many Requests), wait briefly before next model
      if (error.message.includes('503') || error.message.includes('429')) {
        await delay(2000);
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