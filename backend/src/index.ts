import express from 'express';
import cors from 'cors';

// --- Persona & Analyzer Definitions ---

type Persona = {
  id: string;
  name: string;
  description: string;
  // Each analyzer is a function that takes scraped data and returns a string analysis.
  analyzers: ((data: { title: string }) => string)[];
};

const titleAnalyzer = (data: { title: string }, persona: Persona) =>
  `As ${persona.name}, I found the title "${data.title}" to be a standard document title. From my perspective as ${persona.description}, you could consider using more engaging, benefit-oriented language.`;

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
    analyzers: [titleAnalyzer],
  },
};

const runTestHandler = async (req: express.Request, res: express.Response) => {
  const { url, personaId } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  if (!personaId || !personas[personaId]) {
    return res.status(400).json({ error: 'A valid personaId is required' });
  }

  try {
    console.log('Sending request to Browserless...');

    // This script runs on the Browserless.io servers.
    const browserScript = `
      export default async ({ page, context }) => {
        const { url } = context;
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
        const title = await page.title();
        return { title };
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
    const analyses = activePersona.analyzers.map(analyzer => analyzer(result, activePersona));

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
