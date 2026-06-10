import express, { Request, Response } from 'express';
import { supabase, authenticateRequest } from './services';
import { generateContentWithFallback } from './ai-service';
import { scrapeUrl } from './analysis-controller';
import { COMMUNITY_INSIGHT_EXTRACTION_PROMPT, SIDEKICK_CHAT_PROMPT } from './prompts';

// Define a type for the community ingestion item
interface CommunityIngestionItem {
  rawData?: string;
  sourceUrl?: string;
  documentTypeHint?: 'whatsapp' | 'transcript' | 'meeting_notes' | 'auto'; // Refactored for Community
  label?: string; 
  experimentId?: string; // CTO: Support for experiment pinning
}

/**
 * The Multi-Source Shredder (Backend)
 * Logic adapted from careerIngestHandler to extract Motivations, Triggers, and Objections.
 */
export const communityIngestHandler = async (req: Request, res: Response) => {
  const user = (req as any).user; // Scoped by authenticateRequest middleware
  const ingestionItems: CommunityIngestionItem[] = req.body.items; 
  
  // CTO FIX: Default to General Vault (unassigned) if no valid UUID is provided
  const globalExperimentId = req.body.experimentId && req.body.experimentId !== '' 
    ? req.body.experimentId 
    : null;

  if (!ingestionItems || !Array.isArray(ingestionItems) || ingestionItems.length === 0) {
    return res.status(400).json({ error: 'Array of community ingestion items required' });
  }

  const reviewItems: any[] = [];

  try {
    for (const item of ingestionItems) {
      let { rawData, sourceUrl, label, documentTypeHint } = item;
      if (!rawData && !sourceUrl) continue; 

      try {
        const sourceLabel = label || sourceUrl || 'Manual Intake';
        console.log(`🚀 [COMMUNITY INGEST] Processing: ${sourceLabel}`);

        // --- STEP 3: SMART DELTA GUARD ---
        // Find the most recent timestamp for this specific source label to prevent duplicates
        const { data: latestAsset } = await supabase
          .from('community_assets')
          .select('created_at')
          .eq('label', sourceLabel)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const latestTimestamp = latestAsset?.created_at;
        console.log(`⏱️ [SMART DELTA] Latest timestamp for "${sourceLabel}": ${latestTimestamp || 'NONE'}`);

        if (sourceUrl && !rawData) {
          const isActualUrl = sourceUrl.trim().startsWith('http') || (sourceUrl.includes('.') && !sourceUrl.includes(' '));
          if (isActualUrl) {
            try {
               const scraped = await scrapeUrl(sourceUrl);
               rawData = `TITLE: ${scraped.title}\nBODY CONTENT: ${scraped.bodyText}\nVISUALS: ${JSON.stringify(scraped.images)}`;
            } catch (scrapeErr) {
               console.warn('Scraping failed for community asset', scrapeErr);
            }
          }
        }

        const prompt = COMMUNITY_INSIGHT_EXTRACTION_PROMPT(
          rawData || sourceUrl || 'No content provided', 
          sourceLabel,
          latestTimestamp
        );

        const structuredData = await generateContentWithFallback(prompt);
        console.log(`🤖 [GEMINI RAW RESPONSE] Preview: ${structuredData.substring(0, 150)}...`);

        const jsonMatch = structuredData.match(/\{[\s\S]*\}/);
        if (!jsonMatch) continue;
        
        const { insights } = JSON.parse(jsonMatch[0]) || { insights: [] };
        console.log(`✨ [SHREDDER SUCCESS] Extracted ${insights?.length || 0} insights from item.`);

        // Normalize for the frontend Review Queue (NOT saved to DB until the user approves)
        const processed = (insights || []).map((ins: any) => ({
          user_id: user?.id,
          content: ins.content,
          source_type: ins.source_type || documentTypeHint || 'observation',
          source_url: sourceUrl || 'direct_upload',
          label: sourceLabel,
          extracted_insights: ins.extracted_insights,
          media_attachments: ins.media_references || [],
          experiment_id: globalExperimentId || null
        }));

        reviewItems.push(...processed);

      } catch (e: any) {
        console.error('❌ [COMMUNITY INGEST ERROR] item:', item, e);
      }
    }

    res.json({ success: true, count: reviewItems.length, assets: reviewItems });
  } catch (e: any) {
    res.status(500).json({ error: 'Community ingestion failed', details: e.message });
  }
};

/**
 * The Mirror User Sidekick
 * Refactored for persona recalibration and community analysis.
 */
export const communitySidekickHandler = async (req: Request, res: Response) => {
  const { message, currentPersona } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  try {
    // TODO: Update prompt for Community Persona Synthesis (Step 5)
    const aiResponse = await generateContentWithFallback(SIDEKICK_CHAT_PROMPT(message, 'Community Library', currentPersona));
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI failed to generate community strategy.');
    
    const data = JSON.parse(jsonMatch[0]);
    res.json({ success: true, reply: data.reply, updatedPersona: data.updatedResume });

  } catch (e: any) {
    res.status(500).json({ error: 'Community Sidekick failed', details: e.message });
  }
};

/**
 * Experiment Publisher
 * Refactored from publishResumeHandler for Step 4.
 */
export const publishExperimentHandler = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { experimentData } = req.body; // Expects full experiment object
  if (!experimentData) return res.status(400).json({ error: 'Experiment data required' });

  try {
    const slug = experimentData.slug || `${(experimentData.title || 'new-experiment').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;
    
    const payload = {
      ...experimentData,
      user_id: user?.id,
      slug
    };

    const { data, error } = await supabase
      .from('experiments')
      .upsert(payload, { onConflict: 'slug' })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, url: `/experiment/${data.slug}`, data });
  } catch (e: any) {
    res.status(500).json({ error: 'Experiment publishing failed', details: e.message });
  }
};

/**
 * Public Experiment Getter
 * Fetches experiment details, sessions, and discussions by slug.
 */
export const getPublicExperimentHandler = async (req: Request, res: Response) => {
  const { slug } = req.params;
  try {
    const { data: experiment, error } = await supabase.from('experiments').select('*').eq('slug', slug).single();
    if (error || !experiment) return res.status(404).json({ error: 'Experiment not found' });

    const { data: sessions } = await supabase.from('experiment_sessions').select('*').eq('experiment_id', experiment.id).order('session_date', { ascending: false });
    const { data: discussions } = await supabase.from('experiment_discussions').select('*').eq('experiment_id', experiment.id).order('created_at', { ascending: false });
    const { data: highlights } = await supabase.from('community_assets').select('*').eq('experiment_id', experiment.id).order('created_at', { ascending: false });

    res.json({ success: true, experiment, sessions: sessions || [], discussions: discussions || [], highlights: highlights || [] });
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to fetch experiment', details: e.message });
  }
};

// Columns that actually exist on the community_assets table. Any other fields
// coming from the shared AssetCard editor are dropped so a save never 500s.
const COMMUNITY_ASSET_COLUMNS = [
  'content',
  'source_type',
  'source_url',
  'label',
  'extracted_insights',
  'media_attachments',
  'experiment_id'
];

const pickAssetFields = (body: any): Record<string, any> => {
  const out: Record<string, any> = {};
  for (const key of COMMUNITY_ASSET_COLUMNS) {
    if (body && key in body) out[key] = body[key];
  }
  return out;
};

/**
 * CRUD: Save Approved Insight
 * Persists an approved/edited insight to the user's community library.
 */
export const saveCommunityAssetHandler = async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { data, error } = await supabase
      .from('community_assets')
      .insert([{ ...pickAssetFields(req.body), user_id: user.id }])
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, asset: data });
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to save insight', details: e.message });
  }
};

/**
 * CRUD: Update Insight
 * Updates an existing library asset owned by the requesting user.
 */
export const updateCommunityAssetHandler = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { data, error } = await supabase
      .from('community_assets')
      .update(pickAssetFields(req.body))
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, asset: data });
  } catch (e: any) {
    res.status(500).json({ error: 'Update failed', details: e.message });
  }
};

/**
 * CRUD: Delete Insight
 * Removes a library asset owned by the requesting user.
 */
export const deleteCommunityAssetHandler = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { error } = await supabase
      .from('community_assets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: 'Delete failed', details: e.message });
  }
};

/**
 * CTO Audit Helper
 * Logic extracted from index.ts to keep the main entry point lean.
 */
export const getProjectBetaAudit = async () => {
  try {
    const tableChecks = await Promise.all([
      supabase.from('community_assets').select('id').limit(1),
      supabase.from('experiments').select('id').limit(1),
      supabase.from('community_personas').select('id').limit(1)
    ]);

    return {
      community_assets: tableChecks[0]?.error ? `ERROR: ${tableChecks[0].error.message}` : (tableChecks[0] ? 'CONNECTED' : 'UNREACHABLE'),
      experiments: tableChecks[1]?.error ? `ERROR: ${tableChecks[1].error.message}` : (tableChecks[1] ? 'CONNECTED' : 'UNREACHABLE'),
      community_personas: tableChecks[2]?.error ? `ERROR: ${tableChecks[2].error.message}` : (tableChecks[2] ? 'CONNECTED' : 'UNREACHABLE')
    };
  } catch (dbErr: any) {
    console.error('🚨 [COMMUNITY AUDIT] DB Audit failed:', dbErr.message);
    return {
      community_assets: `CRASH: ${dbErr.message}`,
      experiments: `CRASH: ${dbErr.message}`,
      community_personas: `CRASH: ${dbErr.message}`
    };
  }
};

// --- Modular Community Router ---
const router = express.Router();

// Public Community Routes
router.get('/public/experiment/:slug', getPublicExperimentHandler);

// Protected Product Routes
router.post('/ingest', authenticateRequest, communityIngestHandler);
router.post('/sidekick', authenticateRequest, communitySidekickHandler);
router.post('/publish-experiment', authenticateRequest, publishExperimentHandler);

// CRUD: Community library assets (persist approve / edit / delete)
router.post('/assets', authenticateRequest, saveCommunityAssetHandler);
router.put('/assets/:id', authenticateRequest, updateCommunityAssetHandler);
router.delete('/assets/:id', authenticateRequest, deleteCommunityAssetHandler);

export default router;