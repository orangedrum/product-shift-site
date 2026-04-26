import { Request, Response } from 'express';
import { supabase } from './services';
import { generateContentWithFallback } from './ai-service';
import { scrapeUrl } from './analysis-controller';
import { CAREER_ASSET_EXTRACTION_PROMPT } from './prompts';

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

    const prompt = CAREER_ASSET_EXTRACTION_PROMPT(rawData || sourceUrl, libraryContext, role, label);

    const structuredData = await generateContentWithFallback(prompt);
    
    // Robust JSON extraction
    const jsonMatch = structuredData.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI failed to produce valid JSON structure');
    
    const { assets, mappedTitle } = JSON.parse(jsonMatch[0]);

    // Data Normalization
    const normalizedAssets = assets.map((a: any) => ({
      ...a,
      description: Array.isArray(a.description) ? a.description : [a.description],
      roi_metrics: Array.isArray(a.roi_metrics) ? a.roi_metrics : [],
      skills_demonstrated: Array.isArray(a.skills_demonstrated) ? a.skills_demonstrated : (a.story?.data || []),
      story: a.type === 'case_study' ? a.story : null,
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
      You are a World-Class Executive Recruiter. Jean Kaluza (she/her) is the candidate. Jean built User Mirror.
      OBJECTIVE: Orchestrate a tailored, interactive resume for Jean Kaluza for this specific job.
      
      JOB DESCRIPTION:
      "${jdText}"

      STRATEGIC MAPPING LOGIC:
      - HEADLINE SCULPTING: Create a high-authority "Mapped Title" for the resume header (e.g., "General Manager, Nomad Insurance") that matches the JD exactly.
      - Perform 'Functional Title Mapping' for roles. If Jean's past work history title (e.g., 'UX Lead') matches the JD's requirements for a 'General Manager', translate the title to 'General Manager (Discovery & Strategy)'.
      - Do NOT map emerging roles (e.g., 'AI Agent Lead') to time periods before those roles existed (pre-2023).

      AVAILABLE ASSETS (Only select from this list):
      ${assets.map(a => `ID: ${a.id} | Type: ${a.type} | Title: ${a.title} | Company: ${a.company}`).join('\n')}

      TASK:
      Select a maximum of 24 assets from the list above (DO NOT hallucinate or make up any assets):
      - CRITICAL: Do NOT hallucinate assets. If a type (like case_study) is not in the list, DO NOT include it.
      - Distribution Goal: 5 work_history, 6 skill, 4 technical tooling, and the best available talks, writing samples, or recommendations.
      - Omit all dates/years from titles/descriptions to prevent bias.

      Return a JSON object with two keys: "selectedIds" (ARRAY of IDs) and "mappedTitle" (STRING for the resume headline).
    `;

    const aiResponse = await generateContentWithFallback(prompt);
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI failed to select assets');
    
    const { selectedIds, mappedTitle } = JSON.parse(jsonMatch[0]);
    
    // Filter full asset data for the frontend
    const curatedPitch = assets.filter(a => selectedIds.includes(a.id));

    // 4. Generate AI Professional Summary
    const summaryPrompt = `Based on this JD and these selected assets, write a 3-sentence Professional Summary for Jean Kaluza (she/her). 
    STRICT OUTPUT: Return ONLY the summary text. No labels, no quotes, no introductory sentences like "Here is a summary...". Just the raw text. Focus on her strategic outcomes and speed.`;
    const strategicHook = await generateContentWithFallback(summaryPrompt);

    res.json({ 
      success: true, 
      data: {
        assets: curatedPitch,
        strategicHook,
        targetTitle: jdData.title,
        mappedTitle: mappedTitle || "Product Strategist & Growth Lead"
      }
    });
  } catch (e: any) {
    console.error('❌ [PITCH GENERATION ERROR]:', e);
    res.status(500).json({ error: 'Pitch generation failed', details: e.message });
  }
};

export const sidekickChatHandler = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const adminPin = process.env.ADMIN_PIN || process.env.ADMIN_SECRET_KEY;
  if (!authHeader || authHeader.split(' ')[1] !== adminPin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { message, currentResume } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  try {
    // 1. Fetch library context
    const { data: existingAssets } = await supabase.from('career_assets').select('title, company, type, description');
    const libraryContext = (existingAssets || [])
      .map(a => `- ${a.type}: ${a.title} @ ${a.company}`)
      .join('\n');

    // 2. Strategic Prompting
    const prompt = `
      You are the Registry Sidekick, an elite Executive Recruiter and Coach for Jean Kaluza (she/her).
      Jean is using her 'Brag Engine' to build a library of high-impact career assets.
      
      JEAN'S MESSAGE:
      "${message}"
      
      CONTEXT FOR STRATEGY:
      - Jean built and LAUNCHED 'User Mirror' (AI UX research agent) as a live SaaS product. 
      - She runs 'ProductShift'.
      - She is a leader in 'Vibe Coding' (high-velocity AI-assisted engineering). 
      - She is far beyond basic AI tools (competitors like base44 or lovable don't match her speed/depth).
      - Her work on User Mirror proves end-to-end product/growth leadership.
      
      CURRENT LIBRARY CONTEXT:
      ${libraryContext || 'Library is currently empty.'}
      
      TASK:
      1. ANALYZE: Identify gaps between her library and the target role she mentioned.
      2. SCULPT & MERGE: Prioritize "Augmenting" existing work history. Focus on 'Title Mapping'—if she needs to be a 'General Manager', re-frame her ProductShift or Disney experience to reflect that functional title.
      3. NO FAKE CASE STUDIES: Do NOT suggest or generate 'case_study' assets. Jean will add these manually later.
      3. DEDUCTIVE TITLING: Advise Jean on which titles are 'Translations' (SaaS standard) vs 'Fabrications' (Red flags).
      3. SHOWCASE: Treat User Mirror as a live SaaS case study, not a sandbox.
      4. REPLY: Provide a concise, encouraging strategic response.
      
      Return a JSON object:
      {
        "reply": "Strategic coaching message here.",
        "suggestedAssets": [
           {
             "title": "Clear asset title (can be an existing role name to suggest a merge)",
             "company": "ProductShift / User Mirror",
             "dates": "N/A",
             "description": ["High-impact bullet point proving the skill/win"],
             "roi_metrics": ["e.g. 10x development velocity"],
             "type": "win" | "skill" | "tooling" | "work_history",
             "augmenting_existing": boolean (true if this should merge into a blob),
             "role_tag": "Product Lead / AI Strategist",
             "is_published": false
           }
        ]
      }
    `;

    const aiResponse = await generateContentWithFallback(prompt);
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI failed to generate structured strategy.');
    
    const data = JSON.parse(jsonMatch[0]);
    res.json({ success: true, ...data });

  } catch (e: any) {
    console.error('❌ [SIDEKICK CHAT ERROR]:', e);
    res.status(500).json({ error: 'Sidekick failed to respond', details: e.message });
  }
};

export const deleteAssetHandler = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const adminPin = process.env.ADMIN_PIN || process.env.ADMIN_SECRET_KEY;
  if (!authHeader || authHeader.split(' ')[1] !== adminPin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.params;
  try {
    const { error } = await supabase.from('career_assets').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: 'Delete failed', details: e.message });
  }
};

export const publishResumeHandler = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const adminPin = process.env.ADMIN_PIN || process.env.ADMIN_SECRET_KEY;
  if (!authHeader || authHeader.split(' ')[1] !== adminPin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { resumeData } = req.body;
  if (!resumeData) return res.status(400).json({ error: 'Resume data required' });

  try {
    // CTO Fix: Robust slug generation to prevent 500 errors on empty titles
    const safeTitle = (resumeData.targetTitle || 'bespoke-resume').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const slug = `${safeTitle}-${Date.now().toString().slice(-4)}`;
    
    const { data, error } = await supabase.from('career_resumes').insert({
      slug,
      target_role: resumeData.targetTitle,
      mapped_title: resumeData.mappedTitle,
      professional_summary: resumeData.strategicHook,
      selected_assets: resumeData.assets, // Store IDs or objects
      is_live: true
    }).select().single();

    if (error) throw error;

    res.json({ success: true, url: `/resume/${slug}`, data });
  } catch (e: any) {
    console.error('❌ [PUBLISH ERROR]:', e);
    res.status(500).json({ error: 'Publish failed', details: e.message });
  }
};