import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

const generateContentWithFallback = async (prompt: string, screenshot?: string): Promise<string> => {
  // Strategy: Cycle through a prioritized list of models to find one with available free quota.
  const modelsToTry = [
    'gemini-2.0-flash-exp',           // Experimental: Often has separate, generous free quotas.
    'gemini-flash-latest',            // Stable Alias: Usually points to the most reliable Flash version.
    'gemini-2.0-flash-lite-preview-02-05', // Specific Preview: Previews often have distinct quotas.
    'gemini-1.5-flash'                // Fallback: Reliable multimodal model.
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

  for (const modelName of modelsToTry) {
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
    **Format for Section 2:**
    ### TEST RESULT: [PASS / FAIL]
    (Brief explanation of the result).

    ### 4. Visual & Heuristic Analysis
    (Comment on visual hierarchy, layout, and trust signals. Assign a status like [Positive], [Neutral], or [Negative] to key areas.)
    
    ### 5. Actionable Recommendations
    (Provide 2-3 concrete steps. Use this exact format:)
    - **ISSUE:** [Brief description of the problem]
    - **FIX:** [Specific action to take]

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
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=b6e3f4',
  },
  'sam-college-student': {
    id: 'sam-college-student',
    name: 'Sam',
    description: 'a budget-conscious college student',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam&backgroundColor=ffdfbf',
  },
  'charlie-family-worker': {
    id: 'charlie-family-worker',
    name: 'Charlie',
    description: 'a masculine, patriotic blue-collar worker',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie&backgroundColor=c0ebd7',
  },
  'beth-homemaker': {
    id: 'beth-homemaker',
    name: 'Beth',
    description: 'a 45+ family-oriented homemaker with poor eyesight',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Beth&backgroundColor=ffdfbf&glasses=prescription02',
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

    for (const pId of personaIds) {
      const activePersona = personas[pId];
      if (activePersona) {
        const sessionOutput = await generateUserSession(result, activePersona, goal, url);
        userSessions.push({
          persona: activePersona.name,
          avatar: activePersona.avatar,
          analysis: sessionOutput,
          personaObj: activePersona // Keep ref for report generation
        });
      }
    }

    // --- Aggregated Expert Report ---
    const expertReport = await generateAggregatedReport(result, userSessions.map(s => ({ persona: s.personaObj, output: s.analysis })), goal, url);

    res.json({
      message: 'Analysis Complete.',
      title: result.title,
      screenshot: result.screenshot,
      userSessions: userSessions.map(({ persona, avatar, analysis }) => ({ persona, avatar, analysis })),
      expertReport
    });

  } catch (error: any) {
    console.error('Test error:', error);
    res.status(500).json({ error: `Failed to run the test: ${error.message}`, details: error.message });
  }
};

app.post('/api/run-test', runTestHandler);

// Export the app for Vercel
export default app;
