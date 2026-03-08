import { Request, Response } from 'express';
import { supabase } from './services';

// --- Types ---
type LighthouseResult = {
  url: string;
  performanceScore: number;
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  tti: number; // Time to Interactive
  speedIndex: number;
  screenshot?: string;
};

// --- Helpers ---

// Simple XML sitemap parser using Regex to avoid heavy dependencies
// Returns up to 'limit' URLs, prioritizing non-image/asset links
const fetchSitemapUrls = async (baseUrl: string, limit: number = 4): Promise<string[]> => {
  try {
    const sitemapUrl = `${baseUrl.replace(/\/$/, '')}/sitemap.xml`;
    console.log(`[Deep Audit] Fetching sitemap: ${sitemapUrl}`);
    
    const response = await fetch(sitemapUrl, { method: 'GET', headers: { 'User-Agent': 'ProductShift-Audit-Bot/1.0' } });
    if (!response.ok) return [];

    const xml = await response.text();
    const urls: string[] = [];
    
    // Simple regex to find <loc> tags
    const regex = /<loc>(.*?)<\/loc>/g;
    let match;
    while ((match = regex.exec(xml)) !== null) {
      const foundUrl = match[1].trim();
      // Filter out common non-page assets if they appear in sitemap
      if (!foundUrl.match(/\.(jpg|jpeg|png|gif|pdf|xml|css|js)$/i) && foundUrl !== baseUrl) {
        urls.push(foundUrl);
      }
      if (urls.length >= limit * 2) break; // Fetch a few more to filter later
    }

    // Return top 'limit' URLs
    return urls.slice(0, limit);
  } catch (error) {
    console.warn(`[Deep Audit] Failed to fetch sitemap for ${baseUrl}:`, error);
    return [];
  }
};

// Run Lighthouse via Browserless
const runLighthouseAudit = async (url: string): Promise<LighthouseResult | null> => {
  const browserlessToken = process.env.BROWSERLESS_TOKEN;
  if (!browserlessToken) throw new Error('BROWSERLESS_TOKEN is missing.');

  try {
    console.log(`[Deep Audit] Running Lighthouse for: ${url}`);
    // CTO FIX: The /scrape endpoint returned a 400 validation error. The /lighthouse endpoint returned a 404.
    // The only stable endpoint on our plan is /function. Reverting to use the /function endpoint, which is the Golden Record pattern from analysis-controller.ts.
    // We will run lighthouse programmatically inside the browserless function.
    const response = await fetch(`https://production-sfo.browserless.io/function?token=${browserlessToken.trim()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: { url },
        code: `
          export default async function({ page, context, lighthouse }) {
            const url = context.url;

            const { lhr } = await lighthouse(url, {
              output: 'json'
            }, {
              extends: 'lighthouse:default',
              settings: {
                emulatedFormFactor: 'mobile',
                throttling: {
                  rttMs: 150,
                  throughputKbps: 1638.4,
                  cpuSlowdownMultiplier: 4,
                },
                onlyCategories: ['performance'],
                skipAudits: ['screenshot-thumbnails', 'final-screenshot'],
              }
            });

            return { data: { lhr }, type: 'application/json' };
          }
        `
      })
    });

    if (!response.ok) {
      console.error(`[Deep Audit] Browserless /function call failed for ${url}: ${response.status} - ${await response.text()}`);
      return null;
    }

    const data = await response.json();
    // The /function endpoint returns the lighthouse report in `data.lhr`
    const lighthouseReport = data.data?.lhr;
    if (!lighthouseReport) {
        console.error(`[Deep Audit] Lighthouse data (lhr) missing from /function response for ${url}`);
        return null;
    }

    const audits = lighthouseReport.audits;
    const categories = lighthouseReport.categories;

    return {
      url,
      performanceScore: (categories.performance.score || 0) * 100,
      fcp: audits['first-contentful-paint']?.numericValue || 0,
      lcp: audits['largest-contentful-paint']?.numericValue || 0,
      tti: audits['interactive']?.numericValue || 0,
      speedIndex: audits['speed-index']?.numericValue || 0,
    };
  } catch (error) {
    console.error(`[Deep Audit] Error auditing ${url}:`, error);
    return null;
  }
};

// --- Main Controller ---

export const runDeepAuditHandler = async (req: Request, res: Response) => {
  const { url: rawUrl, email } = req.body;
  const COST_IN_CREDITS = 9;

  if (!rawUrl || !email) {
    return res.status(400).json({ error: 'Missing URL or email' });
  }

  // Normalize URL
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  console.log(`[Deep Audit] Starting for ${email} on ${url}`);

  try {
    // 1. Check & Deduct Credits
    // We use the RPC call which handles the balance check atomically
    const { error: deductError } = await supabase.rpc('deduct_credits', { 
      user_email: email, 
      amount: COST_IN_CREDITS 
    });

    if (deductError) {
      return res.status(402).json({ 
        error: 'Insufficient Credits', 
        details: `This Deep Audit requires ${COST_IN_CREDITS} credits.` 
      });
    }

    // 2. Discovery Phase (Sitemap)
    // We fetch the sitemap to find internal pages
    const internalPages = await fetchSitemapUrls(url, 5); // Get top 5 internal pages per user request
    const pagesToAudit = [url, ...internalPages];

    console.log(`[Deep Audit] Identified ${pagesToAudit.length} pages to audit.`);

    // 3. Execution Phase (Sequential Lighthouse to avoid 429 errors on free tier)
    const results: (LighthouseResult | null)[] = [];
    for (const pageUrl of pagesToAudit) {
      const result = await runLighthouseAudit(pageUrl);
      results.push(result);
      // Add a small delay to be a good citizen and prevent rapid-fire requests
      await new Promise(r => setTimeout(r, 500));
    }
    
    // Filter out failed runs
    const validResults = results.filter((r): r is LighthouseResult => r !== null);

    if (validResults.length === 0) {
      // Refund if total failure
      await supabase.rpc('add_credits', { user_email: email, amount: COST_IN_CREDITS });
      return res.status(500).json({ error: 'Audit Failed', details: 'Could not connect to the target site.' });
    }

    // 4. Aggregation & Storage
    const averageScore = Math.round(validResults.reduce((acc, curr) => acc + curr.performanceScore, 0) / validResults.length);
    
    // Save to DB (Assuming an 'audit_reports' table exists or using 'analysis_runs' with a special type)
    const { data: runLog, error: dbError } = await supabase.from('analysis_runs').insert({
      user_identifier: email,
      url: url,
      persona_count: 0, // N/A for performance audit
      plan_type: 'deep_audit',
      report_data: {
        type: 'performance_deep_dive',
        title: `Deep Performance Audit: ${url}`,
        overallScore: averageScore,
        pages: validResults,
        deviceSettings: 'Android (Moto G4) on Slow 3G',
        timestamp: new Date().toISOString()
      }
    }).select('id').single();

    if (dbError) console.error('[Deep Audit] DB Save Error:', dbError);

    // 5. Response
    return res.json({
      success: true,
      reportId: runLog?.id,
      data: {
        overallScore: averageScore,
        pagesAudited: validResults.length,
        results: validResults
      }
    });

  } catch (error: any) {
    console.error('[Deep Audit] Fatal Error:', error);
    // Attempt refund on crash
    await supabase.rpc('add_credits', { user_email: email, amount: COST_IN_CREDITS });
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};