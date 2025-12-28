import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// --- Persona & Analyzer Definitions ---

type ScrapedData = {
  title: string;
  headings: { tag: string; text: string }[];
  bodyText: string;
  screenshot?: string;
};

type Persona = {
  id: string;
  name: string;
  description: string;
  avatar: string;
};

// --- AI Helpers ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// --- Supabase Client ---
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const generateContentWithFallback = async (prompt: string, screenshot?: string): Promise<string> => {
  // Strategy: Cycle through a prioritized list of models to find one with available free quota.
  const modelsToTry = [
    'gemini-1.5-flash-latest', // Highest priority: Stable, generous free tier.
    'gemini-flash-latest',     // Alias for 1.5 Flash
    'gemini-2.0-flash',        // Next best option
    'gemini-2.5-flash',        // Newest flash model
    'gemini-2.0-flash-lite',   // Lite models as final fallbacks
    'gemini-2.5-flash-lite',
    'gemini-flash-lite-latest',
  ];

  // Prepare image part if available
  const imagePart = screenshot ? {
    inlineData: {
      data: screenshot,
      mimeType: "image/jpeg",
    },
  } : null;

  const parts: any[] = [prompt];
  if (imagePart) parts.push(imagePart);

  let lastError: any = null;

  // Helper to delay execution to avoid rate limits
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  for (const modelName of modelsToTry) {
    // Add a "politeness" delay before every attempt to stay under RPM limits
    await delay(2000); 
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(parts);
      const response = result.response;
      return response.text();
    } catch (error: any) {
      console.log(`Model '${modelName}' failed: ${error.message}`);
      lastError = error;
    }
  }

  // If we exit the loop, all models failed. Throw error to be caught by handler.
  throw new Error(`All fallback models failed. Last Error: ${lastError?.message}`);
};

// --- Generators ---

const generateUserSession = async (data: ScrapedData, persona: Persona, goal: string, url: string): Promise<string> => {
  const prompt = `
    You are facilitating a usability test session.

    **Context:**
    - **Persona:** ${persona.name} (${persona.description})
    - **Goal:** "${goal}"
    - **URL:** ${url}

    **Input Data:**
    - Page Title: "${data.title}"
    - Headings: ${JSON.stringify(data.headings.map(h => h.text))}
    - Introductory Body Text: "${data.bodyText}"
    - [Visual Screenshot Attached]

    **Instructions:**

    Adopt the persona of ${persona.name}. You are currently looking at the webpage (screenshot and text).
    Narrate your experience out loud. Be critical, impatient, and honest.
    
    **Required Output Format:**
    |||USER_MOOD|||
    (One word: Positive, Neutral, or Negative)
    |||USER_BUBBLE|||
    (A single, genuine, emotional sentence summarizing your immediate feeling. E.g., "I'm so confused, I don't know where to click!" or "This looks super professional, I trust it.")
    |||USER_DETAILS|||
    ### 1. My Experience
    (2-3 sentences on your immediate reaction. Do you feel confident? Confused? Does the site look trustworthy?)
    
    ### 2. Points of Friction
    (Specific things that confused or annoyed you. Be nitpicky.)
    
    ### 3. What I Think This Is
    (Define the product based ONLY on what you see. Explain why.)

  `;
  return generateContentWithFallback(prompt, data.screenshot);
};

const generateAggregatedReport = async (data: ScrapedData, sessions: { persona: Persona, output: string }[], goal: string, url: string): Promise<string> => {
  const prompt = `
    You are a Senior UX Researcher. You have just observed usability tests with ${sessions.length} different users.
    
    **Required Output Format:**
    ### TEST RESULT: [PASS / FAIL]
    (Brief explanation of the result).

    ### Visual & Heuristic Analysis
    (Comment on visual hierarchy, layout, and trust signals. Assign a status like [Positive], [Neutral], or [Negative] to key areas.)
    
    ### Actionable Recommendations
    (Provide 2-3 concrete steps. Use this exact format:)
    - **ISSUE:** [Description]
    - **FIX:** [Action]

    |||SCORES_JSON|||
    { "usability": 85, "desirability": 70, "clarity": 90 }
    (Provide integer scores based on the aggregate analysis)

    **Context:**
    - **Goal:** "${goal}"
    - **URL:** ${url}
    - [Visual Screenshot Attached]

    **User Session Transcripts:**
    ${sessions.map(s => `
    ---
    USER: ${s.persona.name} (${s.persona.description})
    FEEDBACK:
    ${s.output}
    ---
    `).join('\n')}

    **IMPORTANT:** Do not use markdown tables in your response. Use bullet points or simple text.
  `;
  return generateContentWithFallback(prompt, data.screenshot);
};

// Initialize Express App
const app = express();

// Middleware
app.use(cors()); // Allow requests from any origin
app.use(express.json());

// Routes
app.get('/api', (req, res) => {
  res.send('AI UX Agent Backend is running!');
});

const personas: Record<string, Persona> = {
  'alex-busy-pro': {
    id: 'alex-busy-pro',
    name: 'Alex',
    description: 'a busy professional with two kids under 5',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=b6e3f4&mouth=smile',
  },
  'sam-college-student': {
    id: 'sam-college-student',
    name: 'Sam',
    description: 'a budget-conscious college student',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam&backgroundColor=ffdfbf&mouth=smile',
  },
  'charlie-family-worker': {
    id: 'charlie-family-worker',
    name: 'Charlie',
    description: 'a masculine, patriotic blue-collar worker',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie&backgroundColor=c0ebd7&mouth=smile',
  },
  'beth-homemaker': {
    id: 'beth-homemaker',
    name: 'Beth',
    description: 'a 45+ family-oriented homemaker with poor eyesight',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Beth&backgroundColor=ffdfbf&glasses=prescription02&mouth=smile',
  },
  'sarah-social-shopper': {
    id: 'sarah-social-shopper',
    name: 'Sarah',
    description: 'an avid shopper in her 20s with an active social media following',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&backgroundColor=ffdfbf&mouth=smile',
  },
  'elizabeth-wealthy-elite': {
    id: 'elizabeth-wealthy-elite',
    name: 'Elizabeth',
    description: 'a highly educated and wealthy individual with deep connections',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elizabeth&backgroundColor=c0ebd7&mouth=smile',
  },
};

const runTestHandler = async (req: express.Request, res: express.Response) => {
  const { url, personaIds, goal } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  if (!personaIds || !Array.isArray(personaIds) || personaIds.length === 0) {
    return res.status(400).json({ error: 'At least one persona is required' });
  }

  if (!goal) {
    return res.status(400).json({ error: 'A goal is required' });
  }

  if (!process.env.BROWSERLESS_TOKEN) {
    console.error('BROWSERLESS_TOKEN is not set.');
    return res.status(500).json({ error: 'Server Configuration Error', details: 'The Browserless API token is not configured.' });
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set.');
    return res.status(500).json({ error: 'Server Configuration Error', details: 'The AI API key is not configured.' });
  }

  // --- Usage Limit Check ---
  const userIdentifier = req.ip; // Use IP address for simple unique user tracking
  const today = new Date().toISOString().split('T')[0];
  const GLOBAL_DAILY_LIMIT = 25; // Set a conservative global limit of 25 free tests per day

  try {
    // Check global daily usage
    const { count: globalCount, error: globalError } = await supabase
      .from('daily_usage')
      .select('*', { count: 'exact', head: true })
      .eq('usage_date', today);

    if (globalError) throw globalError;
    if (globalCount !== null && globalCount >= GLOBAL_DAILY_LIMIT) {
      return res.status(429).json({ error: 'Daily Limit Reached', details: 'The global daily limit for free demos has been reached. Please try again tomorrow.' });
    }

    // Check this specific user's daily usage
    const { data: userData, error: userError } = await supabase
      .from('daily_usage')
      .select('count')
      .eq('user_identifier', userIdentifier)
      .eq('usage_date', today)
      .single();

    if (userError && userError.code !== 'PGRST116') throw userError; // Ignore "no rows found" error
    if (userData && userData.count >= 1) {
      return res.status(429).json({ error: 'Demo Limit Reached', details: 'You have already run your free demo for today. Please upgrade to Pro for unlimited tests.' });
    }
  } catch (e: any) {
    return res.status(500).json({ error: 'Database Error', details: `Could not verify usage limits: ${e.message}` });
  }

  try {
    console.log('Sending request to Browserless...');

    // This script runs on the Browserless.io servers.
    const browserScript = `
      export default async ({ page, context }) => {
        const { url } = context;
        await page.setViewport({ width: 1280, height: 800 });
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
        const title = await page.title();

        const headings = await page.evaluate(() => {
          const headingElements = Array.from(document.querySelectorAll('h1, h2, h3'));
          return headingElements.map(h => ({
            tag: h.tagName,
            text: h.textContent?.trim() || ''
          }));
        });

        const bodyText = await page.evaluate(() => {
          const mainEl = document.querySelector('main');
          const contentEl = mainEl || document.body;
          return contentEl.innerText.trim().substring(0, 1500); // Get first 1500 chars
        });

        // Take a screenshot of the viewport (JPEG is smaller/faster for AI analysis)
        const screenshot = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 75 });

        return { title, headings, bodyText, screenshot };
      };
    `;

    const response = await fetch(`https://chrome.browserless.io/function?token=${process.env.BROWSERLESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: browserScript,
        context: { url }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Browserless error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();

    // --- Persona-Driven Analysis ---
    const userSessions: any[] = [];

    // Helper to delay execution to avoid rate limits (Free Tier Throttling)
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (const pId of personaIds) {
      const activePersona = personas[pId];
      if (activePersona) {
        // Add a 6-second delay before each request (except the first) to stay under the RPM limit
        if (userSessions.length > 0) {
            await delay(6000);
        }

        const sessionOutput = await generateUserSession(result, activePersona, goal, url);
        
        // Parse Mood to adjust avatar
        let mood = 'Neutral';
        let adjustedAvatar = activePersona.avatar;
        
        if (sessionOutput.includes('|||USER_MOOD|||')) {
          const moodPart = sessionOutput.split('|||USER_MOOD|||')[1].split('|||')[0].trim();
          if (moodPart.toLowerCase().includes('positive')) {
            mood = 'Positive';
            adjustedAvatar = activePersona.avatar.replace('mouth=smile', 'mouth=smile&eyebrows=default');
          } else if (moodPart.toLowerCase().includes('negative')) {
            mood = 'Negative';
            adjustedAvatar = activePersona.avatar.replace('mouth=smile', 'mouth=sad&eyebrows=frown');
          } else {
            adjustedAvatar = activePersona.avatar.replace('mouth=smile', 'mouth=default&eyebrows=default');
          }
        }

        userSessions.push({
          persona: activePersona.name,
          avatar: adjustedAvatar,
          analysis: sessionOutput,
          personaObj: activePersona // Keep ref for report generation
        });
      }
    }

    // --- On success, increment usage count ---
    const { error: upsertError } = await supabase
      .from('daily_usage')
      .upsert({ user_identifier: userIdentifier, usage_date: today, count: 1 });

    if (upsertError) {
      // Log the error but don't fail the request for the user
      console.error('Failed to increment usage count:', upsertError);
    }

    // --- Aggregated Expert Report ---
    await delay(6000); // Delay before the final expert report generation
    const rawExpertReport = await generateAggregatedReport(result, userSessions.map(s => ({ persona: s.personaObj, output: s.analysis })), goal, url);
    
    // Extract JSON Scores
    let scores = { usability: 0, desirability: 0, clarity: 0 };
    let expertReportText = rawExpertReport;

    if (rawExpertReport.includes('|||SCORES_JSON|||')) {
      const parts = rawExpertReport.split('|||SCORES_JSON|||');
      expertReportText = parts[0];
      try {
        scores = JSON.parse(parts[1].trim());
      } catch (e) {
        console.error('Failed to parse scores JSON', e);
      }
    }

    res.json({
      message: 'Analysis Complete.',
      title: result.title,
      screenshot: result.screenshot,
      userSessions: userSessions.map(({ persona, avatar, analysis, personaObj }) => ({ persona, avatar, analysis, description: personaObj.description })),
      expertReport: expertReportText,
      scores
    });

  } catch (error: any) {
    console.error('Test error:', error);
    res.status(500).json({ error: `Failed to run the test: ${error.message}`, details: error.message });
  }
};

app.post('/api/run-test', runTestHandler);

// Export the app for Vercel
export default app;
