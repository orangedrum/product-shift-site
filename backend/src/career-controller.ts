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

    const prompt = `
      You are a world-class Executive Recruiter and Career Strategist.
      Analyze the following career data. ${role ? `Focus on the perspective of: ${role}.` : 'Identify the primary role/specialization automatically.'}
      ${label ? `This source is labeled as: ${label}.` : ''}
      "${rawData || sourceUrl}"
      
      TASK:
      1. Extract STRONGEST unique points only. Deduplicate against common resume fluff.
      2. Identify ROI statements and "Floating Wins."
      3. Detect the role/specialization if not specified.

      Return a JSON object:
      - title (string), company (string), dates (string), description (Array of 3 impactful strings)
      - roi_metrics (Array of strings like "$3M saved")
      - skills_demonstrated (array of keywords)
      - industry (HealthTech, Fintech, etc.)
      - type (match: work_history, skill, case_study, talk, recommendation, writing_sample, win)
      - role_tag (The primary role identified)
    `;

    const structuredData = await generateContentWithFallback(prompt);
    
    // Robust JSON extraction
    const jsonMatch = structuredData.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI failed to produce valid JSON structure');
    
    const parsed = JSON.parse(jsonMatch[0]);

    // Data Normalization for Supabase JSONB
    if (!Array.isArray(parsed.description)) parsed.description = [parsed.description || ''];
    if (!Array.isArray(parsed.roi_metrics)) parsed.roi_metrics = parsed.roi_metrics ? [parsed.roi_metrics] : [];
    if (!Array.isArray(parsed.skills_demonstrated)) parsed.skills_demonstrated = parsed.skills_demonstrated ? [parsed.skills_demonstrated] : [];
    
    const { data, error } = await supabase.from('career_assets').insert([{ 
      ...parsed, 
      source_url: sourceUrl 
    }]).select().single();
    
    if (error) throw error;
    res.json({ success: true, asset: data });
  } catch (e: any) {
    console.error('❌ [CAREER INGEST ERROR]:', e);
    res.status(500).json({ error: 'Ingestion failed', details: e.message });
  }
};