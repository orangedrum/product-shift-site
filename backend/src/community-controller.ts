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
  const globalExperimentId = req.body.experimentId;

  if (!ingestionItems || !Array.isArray(ingestionItems) || ingestionItems.length === 0) {
    return res.status(400).json({ error: 'Array of community ingestion items required' });
  }

  const savedAssets: any[] = [];

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

        if (sourceUrl && !rawData) {
          const isActualUrl = sourceUrl.trim().startsWith('http') || (sourceUrl.includes('.') && !sourceUrl.includes(' '));
          if (isActualUrl) {
            try {
               const scraped = await scrapeUrl(sourceUrl);
               rawData = `TITLE: ${scraped.title}\nBODY CONTENT: ${scraped.bodyText}`;
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
        const jsonMatch = structuredData.match(/\{[\s\S]*\}/);
        if (!jsonMatch) continue;
        
        const { insights } = JSON.parse(jsonMatch[0]);

        // Persist to community_assets
        const payload = insights.map((ins: any) => ({
          user_id: user?.id,
          content: ins.content,
          source_type: ins.source_type || documentTypeHint || 'observation',
          source_url: sourceUrl || 'direct_upload',
          label: sourceLabel,
          extracted_insights: ins.extracted_insights,
          media_attachments: ins.media_references || []
        }));
        if (globalExperimentId) payload.forEach((p: any) => p.experiment_id = globalExperimentId);

        const { data: inserted, error: dbError } = await supabase.from('community_assets').insert(payload).select();
        if (dbError) throw dbError;
        if (inserted) savedAssets.push(...inserted);

      } catch (e: any) {
        console.error('❌ [COMMUNITY INGEST ERROR] item:', item, e);
      }
    }

    res.json({ success: true, count: savedAssets.length, assets: savedAssets });
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

    res.json({ success: true, experiment, sessions: sessions || [], discussions: discussions || [] });
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to fetch experiment', details: e.message });
  }
};

export const deleteCommunityAssetHandler = async (req: Request, res: Response) => { res.json({ success: true }); };

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

export default router;