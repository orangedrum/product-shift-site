import express from 'express';
import cors from 'cors';
import { webkit } from 'playwright';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: 'http://localhost:5173' })); // Allow requests from our frontend
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('AI UX Agent Backend is running!');
});

app.post('/run-test', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  console.log(`Received request to test URL: ${url}`);

  let browser;
  try {
    console.log('Launching browser...');
    // Use webkit and ensure headless mode for container compatibility
    browser = await webkit.launch({ headless: true });
    const page = await browser.newPage();

    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const pageTitle = await page.title();
    console.log(`Page title: ${pageTitle}`);

    await browser.close();
    console.log('Browser closed.');

    res.json({
      message: `Successfully navigated to the page.`,
      title: pageTitle,
    });
  } catch (error) {
    console.error('Playwright error:', error);
    if (browser) await browser.close();
    res.status(500).json({ error: 'Failed to run the browser test.' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});