import { Request, Response } from 'express';
import { supabase } from './services';
import { scrapeUrl } from './browser-service';
import { generateContentWithFallback } from './ai-service';

export const runFunnelRoastHandler = async (req: Request, res: Response) => {
  const { 
    url, 
    hook, 
    offer, 
    adCreative, 
    competitors, 
    metrics,
    personaIds,
    campaignType
  } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // 1. Scrape the Landing Page
    const scrapeResult = await scrapeUrl(url);

    // 2. Construct the "Dual-Brain" Prompt
    const systemPrompt = `
      You are a Senior Direct Response Media Buyer and CRO Expert (trained on Andromeda & Ben Heath methodologies).
      
      **THE MISSION:**
      Audit the "Ad-to-Page" congruency for this funnel. You are looking for "Scent Mismatch" where the ad promises one thing and the page delivers another.

      **THE INPUTS (The "Chain of Persuasion"):**
      1. **The Hook (Ad Promise):** "${hook || 'Not provided'}"
      2. **The Offer (The Ask):** "${offer || 'Not provided'}"
      3. **The Creative Context:** "${adCreative || 'Not provided'}"
      4. **Competitors:** "${competitors || 'None listed'}"
      5. **User Metrics:** ${JSON.stringify(metrics || {})}
      6. **Campaign Goal:** "${campaignType || 'Leads'}"
      7. **Target Personas:** "${(personaIds || []).join(', ')}"

      **THE LANDING PAGE (The Reality):**
      - URL: ${url}
      - Title: ${scrapeResult.title}
      - H1/Headings: ${scrapeResult.headings.join(', ')}
      - Visible Text: ${scrapeResult.bodyText.substring(0, 1000)}...

      **YOUR ANALYSIS TASKS:**
      1. **Congruency Check:** Does the H1 immediately pay off the Hook? (Score 0-100)
      2. **The "Fold" Test:** Is the Offer visible without scrolling?
      3. **Revenue Guesstimate:** If metrics are provided, estimate potential revenue uplift if friction is fixed. Use industry benchmarks (e.g., E-com CVR ~2.5%).
      4. **Competitor Gap:** How does this stack up against the listed competitors?

      **OUTPUT FORMAT:**
      Return a JSON object with:
      - "congruencyScore": number
      - "revenueProjection": string (e.g., "+$4,200/mo")
      - "summary": string (The roast)
      - "fixes": array of strings
    `;

    // 3. Call the AI Engine
    const analysis = await generateContentWithFallback(systemPrompt, scrapeResult.screenshot);

    // 4. Save to Database
    // Note: user_identifier will be handled by auth middleware in the future, 
    // for now we use 'anonymous_roaster' if not provided to keep it working.
    const { data: run, error } = await supabase.from('analysis_runs').insert({
      url,
      user_identifier: req.body.email || 'anonymous_roaster', 
      plan_type: 'funnel_roast_v1',
      funnel_context: { hook, offer, adCreative, competitors, campaignType, personaIds },
      campaign_metrics: metrics,
      report_data: analysis
    }).select().single();

    if (error) throw error;

    res.json({ success: true, runId: run.id, report: analysis });

  } catch (error: any) {
    console.error('Funnel Roast Error:', error);
    res.status(500).json({ error: 'Analysis Failed', details: error.message, usageCounted: false });
  }
};