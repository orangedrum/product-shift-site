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

// Run Lighthouse via Google PageSpeed Insights (Free, Stable, No Browserless required)
const runPageSpeedAudit = async (url: string): Promise<LighthouseResult | null> => {
  try {
    console.log(`[Deep Audit] Running PageSpeed Insights for: ${url}`);
    
    // CTO FIX: We must provide an API key to get the free 25,000/day quota.
    // Without it, we share a tiny quota with all other anonymous Vercel users and get 429 errors.
    const apiKey = process.env.GOOGLE_PSI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('🚨 [Deep Audit] CRITICAL: No API Key found. Requests will likely fail with 429 Quota Exceeded.');
    }

    // CTO PIVOT: Browserless Free Tier does not support Lighthouse injection.
    // We switch to Google's official PageSpeed Insights API which is free and standard.
    // Strategy 'mobile' simulates the "4-year-old Android" environment we want.
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=PERFORMANCE&key=${apiKey}`;
    
    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Deep Audit] PSI failed for ${url}: ${response.status} - ${errorText}`);
      
      // DIAGNOSTIC: Explicitly tell the user if the API is disabled
      if (errorText.includes('API has not been used in project') || errorText.includes('is not enabled') || errorText.includes('Access Not Configured')) {
        console.error('🚨 ACTION REQUIRED: The PageSpeed Insights API is NOT enabled. Enable it here: https://console.cloud.google.com/apis/library/pagespeedonline.googleapis.com');
      }
      
      return null;
    }

    const data = await response.json();
    const lhr = data.lighthouseResult;

    if (!lhr) {
      console.error(`[Deep Audit] PSI returned no lighthouseResult for ${url}`);
      return null;
    }

    const audits = lhr.audits;
    const categories = lhr.categories;

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
      const result = await runPageSpeedAudit(pageUrl);
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
        pages: validResults,
        deviceSettings: 'Android (Moto G4) on Slow 3G'
      }
    });

  } catch (error: any) {
    console.error('[Deep Audit] Fatal Error:', error);
    // Attempt refund on crash
    await supabase.rpc('add_credits', { user_email: email, amount: COST_IN_CREDITS });
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};