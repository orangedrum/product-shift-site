import express from 'express';
import cors from 'cors';
import { chromium as playwright } from 'playwright-core';

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

  let browser;
  try {
    console.log('Connecting to Browserless...');
    // Connect to Browserless.io
    browser = await playwright.connect({
      wsEndpoint: 'wss://chrome.browserless.io?token=2TeqCwywXGDKLareb25cbb9d8b25c5a6a96c1af2a30b9ee95',
      timeout: 8000, // Fail if connection takes longer than 8 seconds
    });

    const page = await browser.newPage();

    console.log(`Navigating to ${url}...`);
    // Fail if navigation takes longer than 8 seconds (leaving buffer for Vercel's 10s limit)
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 });

    const pageTitle = await page.title();
    await browser.close();
    browser = null;

    res.json({ message: `Test Complete.`, title: pageTitle });
  } catch (error: any) {
    console.error('Playwright error:', error);
    if (browser) await browser.close();
    res.status(500).json({ error: `Failed to run the Playwright test: ${error.message}`, details: error.message });
  }
};

// Register the handler for both paths to be safe against Vercel rewriting
app.post('/api/run-test', runTestHandler);
app.post('/run-test', runTestHandler);

// Export the app for Vercel
export default app;
