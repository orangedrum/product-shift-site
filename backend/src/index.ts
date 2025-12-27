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
  // Strategy: Cycle through a prioritized list of models to find one with available free quota.
  const modelsToTry = [
    'gemini-2.0-flash-exp',           // Experimental: Often has separate, generous free quotas.
    'gemini-flash-latest',            // Stable Alias: Usually points to the most reliable Flash version.
    'gemini-2.0-flash-lite-preview-02-05', // Specific Preview: Previews often have distinct quotas.
    'gemini-pro-latest'               // Fallback: Older but powerful pro model.
  ];

  const prompt = `
    You are a world-class UX analysis agent, embodying the persona of ${persona.name}, who is ${persona.description}.
    Your goal is to: "${goal}".

    You will analyze the following text content from the webpage at ${url} based on Nielsen Norman Group's Usability Heuristics.
    - Page Title: "${data.title}"
    - Headings: ${JSON.stringify(data.headings.map(h => h.text))}
    - Introductory Body Text: "${data.bodyText}"

    Provide your analysis in two parts using Markdown for formatting:
    1.  **Overall Summary:** In a single paragraph, give your first-person summary as ${persona.name}. Summarize what the page is about and your initial gut reaction to its clarity and trustworthiness.
    2.  **Heuristic Analysis:** Provide a short, bulleted list of 2-3 key findings based on these heuristics:
        *   **Clarity & Real-World Match:** Does the language feel clear, familiar, and jargon-free for a user like me?
        *   **Minimalism & Aesthetics:** Based on the text, does the page seem focused, or is it cluttered with information that distracts from my goal?
        *   **Suggestions:** Offer one concrete suggestion for improvement from your perspective.

    Frame all feedback from the first-person perspective (e.g., "As Alex, I felt that..."). Do not simply repeat the scraped text.
  `;

  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error: any) {
      console.log(`Model '${modelName}' failed: ${error.message}`);
      lastError = error;
    }
  }

  // If we exit the loop, all models failed. Run the diagnostic.
  let diagnosticMessage = `All fallback models failed. Last Error: ${lastError?.message}`;

    try {
      const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
      if (!listResponse.ok) {
        const errorText = await listResponse.text();
        diagnosticMessage += `\n\nDIAGNOSTIC: Failed to list models. Status: ${listResponse.status}. Response: ${errorText}`;
      } else {
        const listData = await listResponse.json();
        if (listData.models) {
          const availableModels = listData.models.map((m: any) => m.name.replace('models/', '')).join(', ');
          diagnosticMessage += `\n\nDIAGNOSTIC SUCCESS: Models tried: ${modelsToTry.join(', ')}. AVAILABLE MODELS: ${availableModels}`;
        } else {
          diagnosticMessage += `\n\nDIAGNOSTIC: API key seems valid but no models were returned. Response: ${JSON.stringify(listData)}`;
        }
      }
    } catch (diagError: any) {
      diagnosticMessage += `\n\nDIAGNOSTIC FAILURE: Could not run diagnosis. Error: ${diagError.message}`;
    }

    throw new Error(diagnosticMessage);
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
