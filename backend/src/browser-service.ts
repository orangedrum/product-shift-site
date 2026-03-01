export const scrapeUrl = async (url: string) => {
  const browserlessToken = process.env.BROWSERLESS_TOKEN;
  if (!browserlessToken) throw new Error('BROWSERLESS_TOKEN is missing in environment variables.');

  const response = await fetch(`https://production-sfo.browserless.io/function?token=${browserlessToken.trim()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: `export default async function({ page, context }) {
        const url = context.url;
        // Optimize: Use domcontentloaded + short sleep instead of networkidle2 to prevent timeouts on heavy sites
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
        await new Promise(r => setTimeout(r, 2000)); // Allow 2s for basic hydration/fonts
        const title = await page.title();
        const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 8000));
        const headings = await page.evaluate(() => Array.from(document.querySelectorAll('h1, h2, h3')).map(h => ({ tag: h.tagName, text: h.innerText })));
        const screenshot = await page.screenshot({ type: 'jpeg', quality: 60, fullPage: false, encoding: 'base64' });
        return { data: { title, bodyText, headings, screenshot }, type: 'application/json' };
      };`,
      context: { url }
    })
  });

  if (!response.ok) throw new Error(`Browserless Error: ${response.status} - ${await response.text()}`);
  const jsonResponse = await response.json();
  return jsonResponse.data;
};