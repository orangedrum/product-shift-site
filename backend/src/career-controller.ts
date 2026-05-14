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

        const prompt = CAREER_ASSET_EXTRACTION_PROMPT(
          rawData || sourceUrl || 'No content provided', 
          libraryContext, 
          role, 
          label, 
          documentTypeHint, 
          verifiedEmployers
        );

          const structuredData = await generateContentWithFallback(prompt);
          
          // Robust JSON extraction
          const jsonMatch = structuredData.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            console.error('AI failed to produce valid JSON structure for item:', item);
            continue; // Skip to the next item if AI fails for this one
          }
          
          const { assets } = JSON.parse(jsonMatch[0]) || { assets: [] };

          // Data Normalization
          const normalizedAssets = (assets || []).map((a: any) => ({
            ...a,
            description: (Array.isArray(a.description) ? (a.description as any[]) : [a.description]).filter((d: string) => typeof d === 'string' && d.length > 0),
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

    // 3. AI Selection Logic (Exhaustive Correlation)
    const prompt = `
      You are a World-Class Executive Recruiter and Strategy Consultant. Jean Kaluza (she/her) is the candidate. 
      Jean is a 'Full-Circle Growth Product Designer'—a rare hybrid who bridges UX Research, High-Velocity Engineering, and Media Buying ROI.

      OBJECTIVE: Analyze the JD and provide a strategic recommendation for Jean's resume.
      
      JOB DESCRIPTION:
      "${jdText}"

      STRATEGIC MAPPING LOGIC:
      - **THE UNFAIR ADVANTAGE:** Highlight Jean's cross-over skills: UX Research + Production Engineering (Docker, GitHub, Terminal, VS Code). She speaks "developer" better than any UX researcher in the field.
      - **GROWTH FLYWHEEL:** Prioritize assets that prove she implements 'Product-Flywheels' and uses research to trigger psychological levers in media buying.
      - **HEADLINE SCULPTING:** Create a high-authority "Mapped Title" (e.g., "Director of Growth Engineering") that mirrors the JD's level of seniority and function.
      - **FUNCTIONAL TRANSLATION:** Translate legacy titles into JD-optimized power roles. If she acted as a 'GM' at ProductShift, use that title.
      - Do NOT map emerging roles (e.g., 'AI Agent Lead') to time periods before those roles existed (pre-2023).

      AVAILABLE ASSETS:
      ${assets.map(a => `
        ID: ${a.id} 
        Type: ${a.type} 
        Title: ${a.title} 
        Company: ${a.company} 
        Metrics: ${a.roi_metrics?.join(', ')}
        Description: ${Array.isArray(a.description) ? a.description.join(' ') : (a.description || '')}`).join('\n')}

      TASK:
      1. EXHAUSTIVE MAPPING: Select EVERY asset from the library that correlates to a requirement, skill, or responsibility in the JD.
      2. MANDATORY MIX: A high-authority resume MUST include more than just jobs. You MUST select at least 5 Skills, 3 Recommendations, 2 ROI Wins, and any relevant Articles/Talks found in the library.
      3. PROOF OF AUTHORITY: Prioritize assets from Tier-1 brands (Disney, Pluralsight) and those with quantifiable percentages (ROI), even if they are supportive evidence rather than direct JD matches.
      4. NO LIMITS: Do not summarize or truncate the asset count. If Jean has 40 relevant proofs, include all 40. Obviousness is built through volume of evidence.
      5. STRATEGIC REASONING: Explain how this exhaustive evidence set solves the specific business threats implied by the JD.
      6. GAP ANALYSIS: List JD requirements that Jean has NO library assets to prove.
      7. BULLET TRIMMING: For 'work_history' only, select the 5-6 most relevant bullets per job.

      Return a JSON object with: 
      "selectedIds" (ARRAY of IDs), 
      "trimmedDescriptions" (OBJECT mapping ID to a trimmed ARRAY of relevant description strings),
      "mappedTitle" (STRING), 
      "strategicReasoning" (STRING), 
      "gapAnalysis" (ARRAY of strings).
      - CRITICAL: Do NOT hallucinate assets. If a type (like case_study) is not in the list, DO NOT include it.
      - DIVERSITY REQUIREMENT: You MUST select assets from every available category (work_history, win, recommendation, writing_sample, talk, skill, tooling) to ensure a high-authority narrative.
      - EVIDENCE FIRST: Prioritize assets with hard metrics (ROI) or recognizable industry brands (Disney, Pluralsight, StackPath, UX Cabin).
      - Omit all dates/years from titles/descriptions to prevent bias.
    `;

    const aiResponse = await generateContentWithFallback(prompt);
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI failed to select assets');
    
    const { selectedIds, trimmedDescriptions, mappedTitle, strategicReasoning, gapAnalysis } = JSON.parse(jsonMatch[0]);
    
    // Filter and merge AI-trimmed descriptions
    const curatedPitch = assets
      .filter(a => selectedIds.includes(a.id))
      .map(a => ({
        ...a,
        description: trimmedDescriptions?.[a.id] || a.description
      }));

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
        mappedTitle: mappedTitle || "Product Strategist & Growth Lead",
        strategicReasoning,
        gapAnalysis
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
    const { data: existingAssets } = await supabase.from('career_assets').select('id, title, company, type, description');
    const libraryContext = (existingAssets || [])
      .map(a => `- [ID: ${a.id}] ${a.type}: ${a.title} @ ${a.company}`)
      .join('\n');

    const aiResponse = await generateContentWithFallback(SIDEKICK_CHAT_PROMPT(message, libraryContext, currentResume));
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI failed to generate structured strategy.');
    
    const data = JSON.parse(jsonMatch[0]);
    console.log('🤖 [SIDEKICK RESPONSE]:', JSON.stringify(data, null, 2));

    let reply = data.reply || "I'm not sure how to handle that request, but I'm always learning!";
    let suggestedAssets = data.suggestedAssets || [];

    // CTO Helper: Ensure AI output matches our DB schema (Arrays must be Arrays)
    const normalizeAsset = (a: any) => ({
      ...a,
      description: Array.isArray(a.description) 
        ? a.description 
        : (typeof a.description === 'string' ? a.description.split('\n').map((s: string) => s.trim().replace(/^[•\-\*]\s*/, '')).filter(Boolean) : []),
      roi_metrics: Array.isArray(a.roi_metrics) ? a.roi_metrics : [],
      skills_demonstrated: Array.isArray(a.skills_demonstrated) ? a.skills_demonstrated : []
    });

    // CTO FIX: Support for Batch Merging/Consolidation
    if (data.action === 'merge' && data.master_asset && data.remove_ids) {
      console.log(`🔄 [MERGE OPERATION] Keeping ${data.master_asset.id}, Removing: ${data.remove_ids.join(', ')}`);
      const normalizedMaster = normalizeAsset(data.master_asset);

      // 1. Update the Master
      const { data: updatedMaster, error: updateError } = await supabase
        .from('career_assets')
        .update(normalizedMaster)
        .eq('id', normalizedMaster.id)
        .select()
        .single();
      
      if (updateError) throw updateError;

      // 2. Purge the Duplicates
      const { error: removeError } = await supabase
        .from('career_assets')
        .delete()
        .in('id', data.remove_ids);
      
      if (removeError) throw removeError;

      return res.json({ success: true, reply: `Successfully merged assets into "${updatedMaster.title}".`, suggestedAssets: [updatedMaster] });
    }

    // Handle CRUD operations
    if (data.action) {
      switch (data.action) {
        case 'add':
          if (data.asset) {
            const normalizedAsset = normalizeAsset(data.asset);
            const { data: newAsset, error: addError } = await supabase.from('career_assets').insert([normalizedAsset]).select().single();
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
            const normalizedAsset = normalizeAsset(data.asset);
            const { data: updatedAsset, error: updateError } = await supabase.from('career_assets').update(normalizedAsset).eq('id', normalizedAsset.id).select().single();
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
    const payload = {
      target_role: resumeData.targetTitle,
      mapped_title: resumeData.mappedTitle,
      professional_summary: resumeData.strategicHook,
      cover_letter: resumeData.coverLetter,
      selected_assets: resumeData.assets, // Store IDs or objects
      is_live: true
    };

    // CTO FIX: Support for editing already published resumes
    if (resumeData.id) {
      console.log(`♻️ [PUBLISH] Updating existing resume ID: ${resumeData.id}`);
      const { data, error } = await supabase
        .from('career_resumes')
        .update(payload)
        .eq('id', resumeData.id)
        .select()
        .single();
      if (error) throw error;
      return res.json({ success: true, url: `/resume/${data.slug}`, data });
    }

    // Otherwise, create a new one
    const safeTitle = (resumeData.targetTitle || 'bespoke-resume').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const slug = `${safeTitle}-${Date.now().toString().slice(-4)}`;
    
    const { data, error } = await supabase.from('career_resumes').insert({
      ...payload,
      slug,
      is_live: true
    }).select().single();

    if (error) throw error;

    res.json({ success: true, url: `/resume/${slug}`, data });
  } catch (e: any) {
    console.error('❌ [PUBLISH ERROR]:', e);
    res.status(500).json({ error: 'Publish failed', details: e.message });
  }
};

export const consolidateWorkHistoryHandler = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const adminPin = process.env.ADMIN_PIN || process.env.ADMIN_SECRET_KEY;
  
  if (!authHeader || authHeader.split(' ')[1] !== adminPin) {
    return res.status(401).json({ error: 'Unauthorized: Admin access required' });
  }

  try {
    // 1. Fetch all work history assets
    const { data: assets, error: fetchError } = await supabase
      .from('career_assets')
      .select('*')
      .eq('type', 'work_history');
    
    if (fetchError) throw fetchError;
    if (!assets || assets.length === 0) return res.json({ success: true, message: 'No work history found.' });

    // 2. Group by normalized Company + Title
    const groups: Record<string, any[]> = {};
    assets.forEach(a => {
      const key = `${(a.company || 'Unknown').toLowerCase().trim()}|${(a.title || 'Unknown').toLowerCase().trim()}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(a);
    });

    let consolidatedCount = 0;
    for (const key in groups) {
      const group = groups[key];
      if (group.length > 1) {
        // Pick the first one as the Master Asset
        const master = group[0];
        const others = group.slice(1);

        const allDescriptions = new Set<string>();
        const allRoi = new Set<string>();
        const allSkills = new Set<string>();

        // Collect all data from the group
        group.forEach(asset => {
          (asset.description || []).forEach((d: string) => d && allDescriptions.add(d));
          (asset.roi_metrics || []).forEach((r: string) => r && allRoi.add(r));
          (asset.skills_demonstrated || []).forEach((s: string) => s && allSkills.add(s));
        });

        // Robust case-insensitive deduplication
        const deduplicate = (set: Set<string>) => {
           const unique: string[] = [];
           const seen = new Set<string>();
           set.forEach(val => {
             const normalized = val.toLowerCase().trim();
             if (normalized && !seen.has(normalized)) {
               seen.add(normalized);
               unique.push(val.trim());
             }
           });
           return unique;
        };

        const updatePayload = {
          description: deduplicate(allDescriptions),
          roi_metrics: deduplicate(allRoi),
          skills_demonstrated: deduplicate(allSkills)
        };

        // 3. Persist the giant representation and remove fragments
        await supabase.from('career_assets').update(updatePayload).eq('id', master.id);
        await supabase.from('career_assets').delete().in('id', others.map(o => o.id));
        consolidatedCount += others.length;
      }
    }

    res.json({ success: true, consolidatedCount });
  } catch (e: any) {
    console.error('❌ [CONSOLIDATE ERROR]:', e);
    res.status(500).json({ error: 'Consolidation failed', details: e.message });
  }
};