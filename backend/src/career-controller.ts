import { Request, Response } from 'express';
import { supabase } from './services';
import { generateContentWithFallback } from './ai-service';

export const careerIngestHandler = async (req: Request, res: Response) => {
  // Admin Auth Check
  const authHeader = req.headers.authorization;
  const adminPin = process.env.ADMIN_PIN || process.env.ADMIN_SECRET_KEY;
  
  if (!authHeader || authHeader.split(' ')[1] !== adminPin) {
    return res.status(401).json({ error: 'Unauthorized: Admin access required' });
  }

  const { rawData, sourceUrl, role, label } = req.body;
  if (!rawData && !sourceUrl) return res.status(400).json({ error: 'Data or URL required' });

  try {
    console.log(`🚀 [CAREER INGEST] Processing asset for role: ${role || 'Auto-detect'}`);

    // CTO Logic: Fetch existing asset titles to help AI deduplicate against the current library
    const { data: existingAssets } = await supabase
      .from('career_assets')
      .select('title, company, type');
    
    const libraryContext = (existingAssets || [])
      .map(a => `- ${a.type}: ${a.title} (${a.company})`)
      .join('\n');

    const prompt = `
      You are a world-class Executive Recruiter and Career Strategist.
      Analyze the following career data for Jean Kaluza. 
      ${role ? `Focus on the perspective of: ${role}.` : 'Identify the primary role/specialization automatically for each item.'}
      ${label ? `This source is labeled as: ${label}.` : ''}
      "${rawData || sourceUrl}"
      
      CURRENT LIBRARY CONTEXT (Do not repeat these):
      ${libraryContext || 'Library is currently empty.'}

      TASK:
      1. Extract EVERY unique career asset NOT already in the Library Context.
      2. For 'tooling', focus on specialized software (Axure, Dovetail, etc.).
      3. Identify if the content is "Published" by a reputable source (e.g., Dovetail, The Startup, Medium, ACM, etc.).
      4. If multiple versions of the same role exist, extract ONLY the version with the highest ROI metrics/impact.

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