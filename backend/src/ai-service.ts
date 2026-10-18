import { delay } from './services';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Free, open-weights models on OpenRouter, ordered by preference.
// All are multimodal (vision-capable) where noted.
const FREE_MODELS = [
  'google/gemma-4-26b-a4b-it:free',
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
  'openrouter/free',
];

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

const openrouterChat = async (messages: OpenRouterMessage[], model: string): Promise<string> => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is missing in environment variables');

  const res = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://www.theproductshift.com',
      'X-Title': 'User Mirror by Product Shift',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter API Error ${res.status}: ${body}`);
  }

  const data: any = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenRouter returned no content');
  return content;
};

export const generateContentWithFallback = async (prompt: string, screenshot?: string): Promise<string> => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is missing in environment variables');

  const maskedKey = `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
  console.log(`[AI Service] Starting generation via OpenRouter. Key: ${maskedKey}`);

  const messages: OpenRouterMessage[] = screenshot
    ? [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${screenshot}` } },
        ],
      }]
    : [{ role: 'user', content: prompt }];

  const textOnlyMessages: OpenRouterMessage[] = [{ role: 'user', content: prompt }];

  let lastError: any = null;
  const errorLog: string[] = [];
  for (const model of FREE_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await openrouterChat(messages, model);
        console.log(`✅ OpenRouter model '${model}' succeeded.`);
        return result;
      } catch (error: any) {
        lastError = error;
        errorLog.push(`${model}: ${error.message}`);
        console.log(`Model '${model}' failed: ${error.message}`);
        if (error.message.includes('429') || error.message.includes('503')) {
          const waitTime = 1000 * Math.pow(2, attempt);
          console.log(`[AI Service] Rate limited/busy. Waiting ${waitTime}ms before retry.`);
          await delay(waitTime);
          continue;
        }
        break;
      }
    }
  }

  if (screenshot) {
    try {
      console.log('[AI Service] Vision failed; falling back to text-only.');
      return await openrouterChat(textOnlyMessages, FREE_MODELS[0]);
    } catch (e: any) {
      lastError = e;
      errorLog.push(`vision-fallback: ${e.message}`);
    }
  }

  throw new Error(`All AI models failed. Errors: ${errorLog.join(' | ')}`);
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
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return {
      status: 'error',
      message: 'OPENROUTER_API_KEY is missing.',
      source: 'not_configured',
      models: [],
      cacheTimestamp: null,
    };
  }

  try {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    if (!res.ok) throw new Error(`OpenRouter models endpoint: ${res.status}`);
    const data: any = await res.json();
    const models = (data?.data || []).map((m: any) => m.id);
    return {
      status: 'ok',
      message: 'OpenRouter AI service reachable.',
      source: 'live',
      models,
      cacheTimestamp: new Date().toISOString(),
    };
  } catch (e: any) {
    return {
      status: 'degraded',
      message: `Failed to reach OpenRouter: ${e.message}`,
      source: 'fallback',
      models: FREE_MODELS,
      cacheTimestamp: new Date().toISOString(),
    };
  }
};