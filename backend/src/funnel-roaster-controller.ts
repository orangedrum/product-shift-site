import { Request, Response } from 'express';
import { supabase } from './services';
import { scrapeUrl } from './browser-service';
import { generateContentWithFallback } from './ai-service';

export const runFunnelRoastHandler = async (req: Request, res: Response) => {
  const { 
    url, 
    hook,
    offer,
    adCreatives, 
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
      You are a Senior Direct Response Media Buyer and CRO Expert (trained on Meta's Andromeda algorithm & Ben Heath's high-conversion methodologies).
      
      **THE MISSION:**
      Audit the "Ad-to-Page" congruency and overall conversion potential for this funnel.

      **THE INPUTS:**
      1. **The Hook (Ad Promise):** "${hook || 'Not provided - INFER from page context if missing'}"
      2. **The Offer (The Ask):** "${offer || 'Not provided - INFER from page context if missing'}"
      3. **The Creatives:** "${Array.isArray(adCreatives) ? adCreatives.join(', ') : adCreatives || 'Not provided'}"
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
      1. **Identify/Confirm Context:** If Hook/Offer were not provided, explicitly state what you perceive them to be based on the page.
      2. **Congruency Check:** Does the H1 immediately pay off the Hook? (Score 0-100). Be strict.
      3. **The "Fold" Test:** Is the Offer visible without scrolling?
      4. **Revenue Guesstimate:** If metrics are provided, estimate potential revenue uplift if friction is fixed. Use industry benchmarks (e.g., E-com CVR ~2.5%).
      5. **Competitor Gap:** How does this stack up against the listed competitors?
      6. **Persona Journey:** For each target persona, simulate a step-by-step journey. **IMPORTANT:** If you see the same persona ID multiple times (e.g., 3x Sarah), you must generate **UNIQUE NAMES** for each variation (e.g. "Sarah", "Jessica", "Emily") while keeping the underlying *archetype* consistent. Do not use numbers like "Sarah 1".
      7. **Advanced Media Buyer Analysis:** 
         - **Meta/Google Algorithms:** How will the page's engagement signals (dwell time, scroll depth) affect ad quality scores?
         - **Ben Heath / Industry Standards:** Apply principles of direct response (Urgency, Scarcity, Social Proof, Authority).
         - **Trends:** Is the design/copy dated or following current high-converting trends?

      **OUTPUT FORMAT:**
      Return a JSON object with:
      - "inferredHook": string (The hook you analyzed against)
      - "inferredOffer": string (The offer you analyzed against)
      - "congruencyScore": number (Integer 0-100)
      - "revenueProjection": string (e.g., "+$4,200/mo")
      - "summary": string (The roast)
      - "fixes": array of strings
      - "personaJourneys": array of objects:
        {
          "persona": "Unique Name",
          "archetype": "Original Persona Name",
          "steps": [
            { "stage": "Ad View", "thought": "...", "sentiment": "Positive/Neutral/Negative" },
            { "stage": "Landing", "thought": "...", "sentiment": "..." },
            { "stage": "Scroll/Read", "thought": "...", "sentiment": "..." },
            { "stage": "Decision", "thought": "...", "sentiment": "..." }
          ],
          "outcome": "Converted" | "Bounced",
          "outcomeReason": "..."
        }
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
      funnel_context: { hook, offer, adCreatives, competitors, campaignType, personaIds },
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