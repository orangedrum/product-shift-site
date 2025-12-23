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

    // We define the script we want Browserless to run as a string.
    // This runs entirely on their servers.
    const browserScript = `
      module.exports = async ({ page, context }) => {
        const { url } = context;
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
        const title = await page.title();
        return { title };
      };
    `;

    const response = await fetch('https://chrome.browserless.io/function?token=2TeqCwywXGDKLareb25cbb9d8b25c5a6a96c1af2a30b9ee95', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: browserScript,
        context: { url } // Pass the URL to the script
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Browserless error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    res.json({ message: 'Test Complete.', title: result.title });

  } catch (error: any) {
    console.error('Test error:', error);
    res.status(500).json({ error: `Failed to run the test: ${error.message}`, details: error.message });
  }
};

// Register the handler for both paths to be safe against Vercel rewriting
// This ensures the API works whether Vercel strips the /api prefix or not.
app.post('/api/run-test', runTestHandler);
app.post('/run-test', runTestHandler);

// Export the app for Vercel
export default app;
