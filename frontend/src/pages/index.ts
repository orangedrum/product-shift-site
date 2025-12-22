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

app.post('/api/run-test', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  let browser;
  try {
    console.log('Launching browser...');
    // Configure for Vercel/Serverless environment
    browser = await playwright.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const pageTitle = await page.title();
    await browser.close();

    res.json({ message: `Test Complete.`, title: pageTitle });
  } catch (error) {
    console.error('Playwright error:', error);
    if (browser) await browser.close();
    res.status(500).json({ error: 'Failed to run the Playwright test on the server.' });
  }
});

// Export the app for Vercel
export default app;