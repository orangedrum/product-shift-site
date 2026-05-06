import { Request, Response } from 'express';
import { supabase } from './services';
import { generateContentWithFallback } from './ai-service';
import { scrapeUrl } from './analysis-controller';
import { CAREER_ASSET_EXTRACTION_PROMPT, SIDEKICK_CHAT_PROMPT } from './prompts';

// Define a type for the ingestion item
interface IngestionItem {
  rawData?: string;
  sourceUrl?: string;
  documentTypeHint?: 'resume' | 'cover_letter' | 'linkedin_profile' | 'auto'; // Hint for AI
  label?: string; // Optional label for the item, e.g., filename
}

export const careerIngestHandler = async (req: Request, res: Response) => {
  // Admin Auth Check
  const authHeader = req.headers.authorization;
  const adminPin = process.env.ADMIN_PIN || process.env.ADMIN_SECRET_KEY;
  
  if (!authHeader || authHeader.split(' ')[1] !== adminPin) {
    return res.status(401).json({ error: 'Unauthorized: Admin access required' });
  }

  // Expect an array of ingestion items
  const ingestionItems: IngestionItem[] = req.body.items; 
  if (!ingestionItems || !Array.isArray(ingestionItems) || ingestionItems.length === 0) {
    return res.status(400).json({ error: 'Array of ingestion items required' });
  }

  const allExtractedAssets: any[] = [];

  try {
    // Loop through each item in the array
    for (const item of ingestionItems) {
      let { rawData, sourceUrl, label, documentTypeHint } = item;
      const role = (item as any).role || (req.body as any).role; // Robust role detection

      if (!rawData && !sourceUrl) {
        console.warn('Skipping ingestion item: Data or URL required.');
        continue; 
      }

      try {
        console.log(`🚀 [CAREER INGEST] Processing item: ${label || sourceUrl || 'raw data'}`);

        // Scrape URL content if provided
        if (sourceUrl && !rawData) {
          // CTO FIX: Defensive check to skip scraping if sourceUrl is clearly raw text
          const isActualUrl = sourceUrl.trim().startsWith('http') || (sourceUrl.includes('.') && !sourceUrl.includes(' '));
          
          if (isActualUrl) {
            try {
               const scraped = await scrapeUrl(sourceUrl);
               rawData = `
                  TITLE: ${scraped.title}
                  VISUAL ASSETS FOUND: ${JSON.stringify(scraped.images)}
                  BODY CONTENT: ${scraped.bodyText}
               `;
               console.log(`✅ Scraped content for URL: ${sourceUrl}`);
            } catch (scrapeErr) {
               console.warn('Scraping failed, falling back to URL-only analysis', scrapeErr);
            }
          } else {
            console.log(`ℹ️ [CAREER INGEST] sourceUrl detected as raw text, skipping scraper.`);
          }
        }

        // Fetch existing asset titles for deduplication context
        const { data: existingAssets } = await supabase.from('career_assets').select('title, company, type');
        const libraryAssets = existingAssets || [];
        const libraryContext = libraryAssets.map(a => `- ${a.type}: ${a.title} (${a.company})`).join('\n');

        // CTO FIX: Generate a hard list of verified employers to ground the AI
        const verifiedEmployers = libraryAssets
          .filter(a => a.type === 'work_history')
          .map(a => a.company)
          .filter((v, i, self) => v && self.indexOf(v) === i)
          .join(', ');

        const prompt = CAREER_ASSET_EXTRACTION_PROMPT(rawData || sourceUrl, libraryContext, role, label, documentTypeHint, verifiedEmployers);

          const structuredData = await generateContentWithFallback(prompt);
          
          // Robust JSON extraction
          const jsonMatch = structuredData.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            console.error('AI failed to produce valid JSON structure for item:', item);
            continue; // Skip to the next item if AI fails for this one
          }
          
          const { assets } = JSON.parse(jsonMatch[0]);

          // Data Normalization
          const normalizedAssets = assets.map((a: any) => ({
            ...a,
            description: Array.isArray(a.description) ? a.description : [a.description],
            roi_metrics: Array.isArray(a.roi_metrics) ? a.roi_metrics : [],
            skills_demonstrated: Array.isArray(a.skills_demonstrated) ? a.skills_demonstrated : (a.story?.results?.metrics || []),
            story: a.type === 'case_study' || a.type === 'talk' || a.type === 'writing_sample' ? a.story : null, // Only store story for specific types
            // Ensure visuals is always an array if it exists
            ...(a.story && { 
              story: { ...a.story, visuals: Array.isArray(a.story.visuals) ? a.story.visuals : [] } 
            }),
            source_url: sourceUrl || 'direct_upload'
          }));
          allExtractedAssets.push(...normalizedAssets);

        } catch (e: any) {
          console.error('❌ [CAREER INGEST ERROR] for item:', item, e);
          // Continue processing other items even if one fails
        }
      }

      if (allExtractedAssets.length === 0) {
        return res.status(500).json({ error: 'Ingestion failed for all provided items.', details: 'No assets could be extracted.' });
      }

      res.json({ success: true, assets: allExtractedAssets });
  } catch (e: any) {
    console.error('❌ [CAREER INGEST ERROR]:', e);
    res.status(500).json({ error: 'Ingestion failed', details: e.message });
  }
};

export const generatePitchHandler = async (req: Request, res: Response) => {
  const { jdUrl } = req.body;
  console.log(`🎯 [PITCH GEN] Received request for URL: ${jdUrl || 'NONE'}`);
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
      Select a maximum of 24 assets from the list above.
      - CRITICAL: Do NOT hallucinate assets. If a type (like case_study) is not in the list, DO NOT include it.
      - DIVERSITY REQUIREMENT: You MUST select assets from every available category (work_history, skill, tooling, talk, recommendation) to ensure a complete resume. Do not leave sections empty if data exists.
      - Distribution Goal: 3 case_study, 5 work_history, 6 skill, 4 technical tooling, 2 talks, 2 writing_samples, 2 recommendations.
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
    const summaryPrompt = `Based on this JD and these selected assets, write a single high-impact, 1-sentence Professional Summary for Jean Kaluza (she/her). 
    STRICT OUTPUT: Return ONLY the text. Maximum 30 words. Focus on ROI and strategic delivery. No labels, no quotes.`;
    const strategicHook = await generateContentWithFallback(summaryPrompt);

    // 5. Generate AI Cover Letter
    const clPrompt = `Write a high-stakes, authoritative strategic cover letter for Jean Kaluza (she/her). 
    Focus on ROI and how her background building 'User Mirror' solves the specific business threats in this JD. Length: 4-5 substantial paragraphs. Be direct and executive-level. No address blocks or sign-offs.`;
    const coverLetter = await generateContentWithFallback(clPrompt);

    res.json({ 
      success: true, 
      data: {
        assets: curatedPitch,
        strategicHook,
        coverLetter,
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
    console.log(`💬 [SIDEKICK CHAT] User message: ${message}`);
    // 1. Fetch library context
    const { data: existingAssets } = await supabase.from('career_assets').select('title, company, type, description');
    const libraryContext = (existingAssets || [])
      .map(a => `- ${a.type}: ${a.title} @ ${a.company}`)
      .join('\n');

    const aiResponse = await generateContentWithFallback(SIDEKICK_CHAT_PROMPT(message, libraryContext, currentResume));
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI failed to generate structured strategy.');
    
    const data = JSON.parse(jsonMatch[0]);
    console.log('🤖 [SIDEKICK RESPONSE]:', JSON.stringify(data, null, 2));

    let reply = data.reply || "I'm not sure how to handle that request, but I'm always learning!";
    let suggestedAssets = data.suggestedAssets || [];

    // Handle CRUD operations
    if (data.action) {
      switch (data.action) {
        case 'add':
          if (data.asset) {
            const { data: newAsset, error: addError } = await supabase.from('career_assets').insert([data.asset]).select().single();
            if (addError) throw addError;
            reply = `Successfully added "${newAsset.title}" (${newAsset.type}) to your library.`;
            // Ensure the new asset includes the ID for potential immediate updates
            data.asset.id = newAsset.id; 
            suggestedAssets = [newAsset]; // Return the newly added asset for immediate display
          } else {
            reply = "I understood you wanted to add an asset, but couldn't find the details. Can you be more specific?";
          }
          break;
        case 'update':
          if (data.asset && data.asset.id) {
            const { data: updatedAsset, error: updateError } = await supabase.from('career_assets').update(data.asset).eq('id', data.asset.id).select().single();
            if (updateError) throw updateError;
            reply = `Successfully updated "${updatedAsset.title}" (${updatedAsset.type}) in your library.`;
            suggestedAssets = [updatedAsset];
          } else {
            reply = "I understood you wanted to update an asset, but couldn't find the ID or details. Can you be more specific?";
          }
          break;
        case 'remove':
          if (data.remove_criteria && (data.remove_criteria.id || (data.remove_criteria.title && data.remove_criteria.type))) {
            let query = supabase.from('career_assets').delete();
            if (data.remove_criteria.id) {
              query = query.eq('id', data.remove_criteria.id);
            } else if (data.remove_criteria.title && data.remove_criteria.type) {
              query = query.eq('title', data.remove_criteria.title).eq('type', data.remove_criteria.type);
            }
            const { error: removeError } = await query;
            if (removeError) throw removeError;
            reply = `Successfully removed asset from your library.`;
          } else {
            reply = "I understood you wanted to remove an asset, but couldn't find enough details (ID, or Title and Type). Can you be more specific?";
          }
          break;
        case 'chat':
        default:
          // Regular chat, reply and suggestedAssets are already set
          break;
      }
    }

    res.json({ success: true, reply, suggestedAssets, updatedResume: data.updatedResume });

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
      cover_letter: resumeData.coverLetter,
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