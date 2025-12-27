import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- Persona & Analyzer Definitions ---

type ScrapedData = {
  title: string;
  headings: { tag: string; text: string }[];
  bodyText: string;
};

type Persona = {
  id: string;
  name: string;
  description: string;
  // Each analyzer is a function that takes scraped data and returns a string analysis.
  analyzers: ((data: ScrapedData, persona: Persona, goal: string, url: string) => Promise<string>)[];
};

// --- AI Analyzer ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const aiAnalyzer = async (data: ScrapedData, persona: Persona, goal: string, url: string): Promise<string> => {
  const modelName = 'gemini-1.5-flash';
  const model = genAI.getGenerativeModel({ model: modelName });

  const prompt = `
    You are a UX analysis agent. Your current persona is ${persona.name}, who is ${persona.description}.
    Your goal is to: "${goal}".

    You have scanned the following content from the webpage at ${url}:
    - Page Title: "${data.title}"
    - Headings: ${JSON.stringify(data.headings.map(h => h.text))}
    - Introductory Body Text: "${data.bodyText}"

    Based on this information, and keeping your persona and goal in mind, provide a short, insightful analysis in a single paragraph.
    - Do NOT simply repeat the title or headings.
    - Summarize what you think the page is about in your own words.
    - Comment on whether the language feels trustworthy and professional from your perspective.
    - State how easy or difficult it was to understand the page's purpose based on the text alone.
    - Frame all feedback from the first-person perspective of your persona. For example: "As Alex, I felt that...".
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error: any) {
    // Diagnostic: Attempt to list models to see what IS available.
    let diagnosticMessage = `Original Error: ${error.message}`;

    try {
      const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
      if (!listResponse.ok) {
        const errorText = await listResponse.text();
        diagnosticMessage += `\n\nDIAGNOSTIC: Failed to list models. Status: ${listResponse.status}. Response: ${errorText}`;
      } else {
        const listData = await listResponse.json();
        if (listData.models) {
          const availableModels = listData.models.map((m: any) => m.name.replace('models/', '')).join(', ');
          diagnosticMessage += `\n\nDIAGNOSTIC SUCCESS: The model '${modelName}' was not found. AVAILABLE MODELS: ${availableModels}`;
        } else {
          diagnosticMessage += `\n\nDIAGNOSTIC: API key seems valid but no models were returned. Response: ${JSON.stringify(listData)}`;
        }
      }
    } catch (diagError: any) {
      diagnosticMessage += `\n\nDIAGNOSTIC FAILURE: Could not run diagnosis. Error: ${diagError.message}`;
    }

    throw new Error(diagnosticMessage);
  }
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
    description: 'a busy professional',
    analyzers: [aiAnalyzer],
  },
};

const runTestHandler = async (req: express.Request, res: express.Response) => {
  const { url, personaId, goal } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  if (!personaId || !personas[personaId]) {
    return res.status(400).json({ error: 'A valid personaId is required' });
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

        return { title, headings, bodyText };
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
    const activePersona = personas[personaId];
    // We now use Promise.all because our AI analyzer is asynchronous.
    const analysisPromises = activePersona.analyzers.map(analyzer => analyzer(result, activePersona, goal, url));
    const analyses = await Promise.all(analysisPromises);

    res.json({
      message: 'Analysis Complete.',
      title: result.title,
      analysis: analyses.join(' '),
    });

  } catch (error: any) {
    console.error('Test error:', error);
    res.status(500).json({ error: `Failed to run the test: ${error.message}`, details: error.message });
  }
};

app.post('/api/run-test', runTestHandler);

// Export the app for Vercel
export default app;
