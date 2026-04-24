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
      You are a world-class Executive Recruiter.
      Analyze the following career data for Jean Kaluza, a high-level Product Strategist. Jean uses she/her pronouns.
      ${role ? `Focus on the perspective of: ${role}.` : 'Identify the primary role/specialization automatically for each item.'}
      ${label ? `CRITICAL CONTEXT: This source is specifically a ${label}.` : ''}
      "${rawData || sourceUrl}"
      
      TASK:
      1. EXHAUSTIVE EXTRACTION: Extract EVERY unique role, win, skill, and tool.
      2. NO DATES: Do NOT extract years, date ranges, or months. Omit the 'dates' field or set to 'N/A'.
      2. LOGIC OVER LAP: Even if a role title exists in the "CURRENT LIBRARY CONTEXT" below, extract this version if the bullet points provide NEW metrics, different ROI numbers, or unique project details.
      3. CHAMPION "EXTRA EXTRA": Identify published articles (Dovetail, The Startup) as primary 'writing_sample' assets.
      4. CASE STUDY DEEP DIVE: For Case Studies, extract the Problem/Methodology/Solution/ROI arc.
      5. RECOMMENDATIONS: For text-based recommendations, use the author's name as 'company' and extract the specific praise as bullet points.
      6. TECHNICAL TOOLING: Itemize tools like Dovetail, Axure, or specific AI agents as 'tooling'.

      CURRENT LIBRARY CONTEXT (Do not repeat these):
      ${libraryContext || 'Library is currently empty.'}

      Return a JSON object with a single key "assets" containing an ARRAY of objects.
      Each object in the array MUST follow this schema:
      {
        "title": "Clear title of asset",
        "company": "Company name or N/A",
        "dates": "N/A",
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

export const generatePitchHandler = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const adminPin = process.env.ADMIN_PIN || process.env.ADMIN_SECRET_KEY;
  if (!authHeader || authHeader.split(' ')[1] !== adminPin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { jdUrl } = req.body;
  if (!jdUrl) return res.status(400).json({ error: 'JD URL required' });

  try {
    // 1. Scrape the Job Description
    const jdData = await scrapeUrl(jdUrl);
    const jdText = `Title: ${jdData.title}\n\nDescription: ${jdData.bodyText}`;

    // 2. Fetch all Career Assets
    const { data: assets } = await supabase.from('career_assets').select('*');
    if (!assets || assets.length === 0) {
      return res.status(404).json({ error: 'Library is empty. Please ingest assets first.' });
    }

    // 3. AI Selection Logic (The Perfect 24)
    const prompt = `
      You are a World-Class Executive Recruiter. Jean Kaluza (she/her) is the candidate.
      OBJECTIVE: Orchestrate a tailored, interactive resume for Jean Kaluza for this specific job.
      
      JOB DESCRIPTION:
      "${jdText}"

      AVAILABLE ASSETS:
      ${assets.map(a => `ID: ${a.id} | Type: ${a.type} | Title: ${a.title} | Company: ${a.company}`).join('\n')}

      TASK:
      Select exactly 24 assets (omit all dates/years from titles/descriptions):
      - 5 work_history
      - 6 skill
      - 3 case_study
      - 2 talk
      - 2 recommendation
      - 2 writing_sample
      - 4 technical tooling
      - Any high-impact wins embedded in the work_history.

      Return a JSON object with a single key "selectedIds" containing an ARRAY of asset IDs.
    `;

    const aiResponse = await generateContentWithFallback(prompt);
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI failed to select assets');
    
    const { selectedIds } = JSON.parse(jsonMatch[0]);
    
    // Filter full asset data for the frontend
    const curatedPitch = assets.filter(a => selectedIds.includes(a.id));

    // 4. Generate AI Professional Summary
    const summaryPrompt = `Based on this JD and these assets, write a 3-sentence Professional Summary for Jean Kaluza (she/her). 
    Output ONLY the summary text. Do NOT include an introduction like "Here is your summary". Focus on her strategic outcomes.`;
    const strategicHook = await generateContentWithFallback(summaryPrompt);

    res.json({ 
      success: true, 
      data: {
        assets: curatedPitch,
        strategicHook,
        targetTitle: jdData.title
      }
    });
  } catch (e: any) {
    console.error('❌ [PITCH GENERATION ERROR]:', e);
    res.status(500).json({ error: 'Pitch generation failed', details: e.message });
  }
};