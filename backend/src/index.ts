import express from 'express';
import cors from 'cors';

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
  analyzers: ((data: ScrapedData, persona: Persona, goal: string) => string)[];
};

const titleAnalyzer = (data: ScrapedData, persona: Persona, goal: string) =>
  `As ${persona.name}, while trying to "${goal}", I found the title "${data.title}" to be a standard document title. From my perspective as ${persona.description}, you could consider using more engaging, benefit-oriented language that speaks directly to my goal.`;

const headingsAnalyzer = (data: ScrapedData, persona: Persona, goal: string) => {
  const h1s = data.headings.filter(h => h.tag === 'H1');
  if (h1s.length === 0) {
    return `As ${persona.name}, I noticed there is no main heading (H1) on the page. This makes it difficult for me to quickly grasp the page's primary purpose when trying to "${goal}".`;
  }
  if (h1s.length > 1) {
    return `As ${persona.name}, I saw multiple main headings (H1s). This can be confusing as it's unclear which one is the most important when I'm trying to "${goal}".`;
  }
  return `The main heading "${h1s[0].text}" clearly communicates the page's topic, which helped me in my goal to "${goal}".`;
};

const bodyAnalyzer = (data: ScrapedData, persona: Persona, goal: string) => {
  if (!data.bodyText || data.bodyText.length < 50) {
    return `As ${persona.name}, I found very little text on the page, which makes it hard to achieve my goal of "${goal}".`;
  }
  if (data.bodyText.length > 1000) {
    return `As a ${persona.description}, I noticed a significant amount of text on the page. To help me achieve my goal of "${goal}", it would be helpful to have a clear summary or key takeaways near the top.`;
  }
  return `The introductory text seems to be of a reasonable length for me to quickly scan and understand the page's content.`;
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
    analyzers: [titleAnalyzer, headingsAnalyzer, bodyAnalyzer],
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
    const analyses = activePersona.analyzers.map(analyzer => analyzer(result, activePersona, goal));

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
