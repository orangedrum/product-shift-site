import express from 'express';
import cors from 'cors';
import { chromium as playwright } from 'playwright-core';
import chromium from '@sparticuz/chromium';

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
    console.log('Launching Serverless Browser...');
    // Configure for Vercel/Serverless environment
    browser = await playwright.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();

    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded' });

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
