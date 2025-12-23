import express from 'express';
import cors from 'cors';

// Initialize Express App
const app = express();

// Middleware
app.use(cors()); // Allow requests from any origin
app.use(express.json());

// Routes
app.get('/api', (req, res) => {
  res.send('AI UX Agent Backend is running!');
});

const runTestHandler = async (req: express.Request, res: express.Response) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
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

    // --- AI INTEGRATION PLACEHOLDER ---
    // TODO: In the future, we will send `result.title` to an AI service.
    // For now, we will generate a mock analysis.
    const mockAiAnalysis = `Based on the title "${result.title}", the page seems to be a standard document. Consider using more engaging, benefit-oriented language.`;

    res.json({ message: 'Analysis Complete.', title: result.title, analysis: mockAiAnalysis });

  } catch (error: any) {
    console.error('Test error:', error);
    const tokenStatus = `DIAGNOSTIC: Token is ${process.env.BROWSERLESS_TOKEN ? 'LOADED' : 'MISSING'}.`;
    res.status(500).json({ error: `Failed to run the test: ${error.message}`, details: `${tokenStatus} Details: ${error.message}` });
  }
};

app.post('/api/run-test', runTestHandler);

// Export the app for Vercel
export default app;
