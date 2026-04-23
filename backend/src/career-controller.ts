import { Request, Response } from 'express';
import { supabase } from './services';
import { generateContentWithFallback } from './ai-service';
import { scrapeUrl } from './analysis-controller';

export const careerIngestHandler = async (req: Request, res: Response) => {
  // Admin Auth Check
  const authHeader = req.headers.authorization;
  const adminPin = process.env.ADMIN_PIN || process.env.ADMIN_SECRET_KEY;
  
  if (!authHeader || authHeader.split(' ')[1] !== adminPin) {
    return res.status(401).json({ error: 'Unauthorized: Admin access required' });
  }

  let { rawData, sourceUrl, role, label } = req.body;
  if (!rawData && !sourceUrl) return res.status(400).json({ error: 'Data or URL required' });

  try {
    console.log(`🚀 [CAREER INGEST] Processing asset for role: ${role || 'Auto-detect'}`);

    // CTO Strategy: If it's a URL ingestion, let's actually scrape the content
    // so Gemini can read the REAL article rather than guessing based on the URL string.
    if (sourceUrl && !rawData) {
      try {
         const scraped = await scrapeUrl(sourceUrl);
         rawData = `Title: ${scraped.title}\n\nBody: ${scraped.bodyText}`;
         console.log(`✅ Scraped content for URL: ${sourceUrl}`);
      } catch (scrapeErr) {
         console.warn('Scraping failed, falling back to URL-only analysis', scrapeErr);
      }
    }

    // CTO Logic: Fetch existing asset titles to help AI deduplicate against the current library
    const { data: existingAssets } = await supabase
      .from('career_assets')
      .select('title, company, type');
    
    const libraryContext = (existingAssets || [])
      .map(a => `- ${a.type}: ${a.title} (${a.company})`)
      .join('\n');

    const prompt = `
      You are a world-class Executive Recruiter and Career Strategist.
      Analyze the following career data for Jean Kaluza, a high-level Product Strategist. 
      ${role ? `Focus on the perspective of: ${role}.` : 'Identify the primary role/specialization automatically for each item.'}
      ${label ? `CRITICAL CONTEXT: This source is specifically a ${label}.` : ''}
      "${rawData || sourceUrl}"
      
      TASK:
      1. CHAMPION "EXTRA EXTRA" CONTENT: If this is a published article or video (especially prestigious sources like Dovetail, The Startup, Medium, or ACM), create a 'writing_sample' or 'talk' entry as the PRIMARY asset.
      2. CASE STUDY DEEP DIVE: If the source is a Case Study, extract a detailed "Logic Proof" structure: The Problem, your strategic Methodology, the Solution, and the measurable ROI Outcome. 
      3. RECOMMENDATIONS: If the source is a recommendation, extract the author's name/role as 'company' and focus the description on the specific "Jean qualities" and results mentioned.
      4. THE "LOGIC PROOF": For all primary entries, emphasize the strategic methodology and thought leadership demonstrated. The 'company' field MUST be the publisher or author's organization.
      5. Extract specific 'win', 'tooling', or 'skill' assets ONLY if they represent unique, high-impact ROI points found within the content that aren't in the context below.
      6. TECHNICAL TOOLING: Ensure tools like Dovetail, Axure, or specific AI agents are categorized as 'tooling'.

      CURRENT LIBRARY CONTEXT (Do not repeat these):
      ${libraryContext || 'Library is currently empty.'}

      Return a JSON object with a single key "assets" containing an ARRAY of objects.
      Each object in the array MUST follow this schema:
      {
        "title": "Clear title of asset",
        "company": "Company name or N/A",
        "dates": "Date range or N/A",
        "description": ["Bullet 1", "Bullet 2"],
        "roi_metrics": ["$3M saved", "300% ROI"],
        "skills_demonstrated": ["Stakeholder Mgmt", "Product Vision"],
        "type": "work_history" | "skill" | "win" | "tooling" | "talk" | "writing_sample" | "recommendation",
        "role_tag": "The primary role context (e.g. UX Researcher, Product Manager)",
        "industry": "e.g. HealthTech, EdTech",
        "is_published": boolean (true if published by a reputable 3rd party)
      }
    `;

    const structuredData = await generateContentWithFallback(prompt);
    
    // Robust JSON extraction
    const jsonMatch = structuredData.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI failed to produce valid JSON structure');
    
    const { assets } = JSON.parse(jsonMatch[0]);

    // Data Normalization
    const normalizedAssets = assets.map((a: any) => ({
      ...a,
      description: Array.isArray(a.description) ? a.description : [a.description],
      roi_metrics: Array.isArray(a.roi_metrics) ? a.roi_metrics : [],
      skills_demonstrated: Array.isArray(a.skills_demonstrated) ? a.skills_demonstrated : [],
      source_url: sourceUrl || 'direct_upload'
    }));

    res.json({ success: true, assets: normalizedAssets });
  } catch (e: any) {
    console.error('❌ [CAREER INGEST ERROR]:', e);
    res.status(500).json({ error: 'Ingestion failed', details: e.message });
  }
};