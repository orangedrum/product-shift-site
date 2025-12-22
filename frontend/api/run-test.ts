import { chromium } from 'playwright';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url } = req.body || {};

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url);
    const pageTitle = await page.title();
    await browser.close();

    return res.status(200).json({ message: 'Test Complete.', title: pageTitle });
  } catch (error: any) {
    console.error('Playwright error:', error);
    return res.status(500).json({ error: 'Failed to run the Playwright test.', details: error.message });
  }
}