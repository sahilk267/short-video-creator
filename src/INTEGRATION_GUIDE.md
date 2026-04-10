/**
 * INTEGRATION GUIDE - Add new services to existing pipeline
 * 
 * This file demonstrates how to inject new services WITHOUT rewriting existing code.
 * All changes are additive and backward-compatible.
 * 
 * Implementation approach:
 * 1. Services are optional (feature flags)
 * 2. Minimal changes to existing files
 * 3. New services wrap/enhance existing logic
 * 4. Graceful degradation if services fail
 */

/**
 * STEP 1: Update Config with services
 * 
 * File: src/index.ts (in main() function)
 */

import { Config } from "./config";
import { ShortCreator } from "./short-creator/ShortCreator";
import { getFeatureFlags } from "./config/featureFlags";
import { MemoryService } from "./memory/memory.service";
import { FeedbackService } from "./feedback/feedback.service";
import { PredictiveService } from "./predict/predict.service";
import { AssetService } from "./assets/asset.service";
import { MetadataService } from "./metadata/metadata.service";
import { BeatSyncService } from "./video/beat-sync.service";
import { AgentLoopService } from "./agents/agent-loop.service";

// Example: In main() after initializing ShortCreator
export async function initializeEnhancedServices(
  config: Config,
  shortCreator: ShortCreator,
): Promise<EnhancedServices> {
  const flags = getFeatureFlags();
  const services: EnhancedServices = {
    flags,
    memory: null,
    feedback: null,
    predictive: null,
    assets: null,
    metadata: new MetadataService(),
    beatSync: null,
    agentLoop: null,
  };

  // Initialize optional services
  if (flags.enableMemory) {
    services.memory = new MemoryService(config.dataDirPath);
  }

  if (flags.enableFeedbackLoop) {
    services.feedback = new FeedbackService();
  }

  if (flags.enablePredictiveScoring) {
    services.predictive = new PredictiveService(services.memory || undefined);
  }

  if (flags.enableAssetFallback) {
    services.assets = new AssetService(config.dataDirPath);
  }

  if (flags.enableBeatSync) {
    services.beatSync = new BeatSyncService();
  }

  // Agent loop depends on other services
  if (flags.enableAgentLoop || flags.enableFeedbackLoop) {
    services.agentLoop = new AgentLoopService(
      services.feedback || undefined,
      services.memory || undefined,
      services.predictive || undefined,
      {
        maxRetries: 2,
        scoreThreshold: 70,
        enableMemory: flags.enableMemory,
        enablePrediction: flags.enablePredictiveScoring,
        enableFeedback: flags.enableFeedbackLoop,
      },
    );
  }

  return services;
}

export interface EnhancedServices {
  flags: ReturnType<typeof getFeatureFlags>;
  memory: MemoryService | null;
  feedback: FeedbackService | null;
  predictive: PredictiveService | null;
  assets: AssetService | null;
  metadata: MetadataService;
  beatSync: BeatSyncService | null;
  agentLoop: AgentLoopService | null;
}

/**
 * STEP 2: Inject into router (minimal changes)
 * 
 * File: src/server/routers/rest.ts
 */

/*
// In APIRouter constructor, add:

export class APIRouter {
  private shortCreator: ShortCreator;
  private config: Config;
  private enhancedServices: EnhancedServices; // Add this
  
  constructor(config: Config, shortCreator: ShortCreator, enhancedServices?: EnhancedServices) {
    this.enhancedServices = enhancedServices || { flags: getFeatureFlags(), ... };
    // Rest of constructor...
  }
  
  // Then in setupRoutes(), add metadata endpoint:
  
  this.router.get(
    "/video/:videoId/metadata",
    async (req: ExpressRequest, res: ExpressResponse) => {
      try {
        // If metadata service enabled and metadata available
        if (this.enhancedServices.metadata) {
          const metadata = this.enhancedServices.metadata.generateMetadata(
            scriptContent,
            req.query.platform as any,
            { category, keywords }
          );
          res.json(metadata);
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  );
}
*/

/**
 * STEP 3: Integrate into script generation (optional feedback loop)
 * 
 * File: src/script-generator/AiLlmGenerator.ts
 */

/*
// In AiLlmGenerator.generateScript(), wrap with agent loop:

async generateScript(
  newsStories: PromptStory[],
  options?: ScriptGenerationOptions,
  agentLoop?: AgentLoopService,  // Optional parameter
): Promise<{ script: string; score: number; hooks?: HookOption[] }> {
  
  // If agent loop enabled, use it
  if (agentLoop) {
    const generationFn = async (feedback?: string) => {
      // Original generation logic with optional feedback prompt
      return originalGeneration(newsStories, options, feedback);
    };
    
    const result = await agentLoop.runLoop(generationFn, {
      category: options?.category || "General",
      topic: options?.topic || "General",
      keywords: options?.keywords,
      style: options?.style,
    });
    
    return {
      script: result.finalScript,
      score: result.finalScore,
      hooks: generateHooks(result.finalScript, options),  // Reuse hook generation
    };
  }
  
  // Otherwise, use original logic
  return originalGeneration(newsStories, options);
}
*/

/**
 * STEP 4: Wrap asset fetching (multi-source fallback)
 * 
 * File: src/short-creator/ShortCreator.ts (around line ~200)
 */

/*
// In ShortCreator constructor, add:

private assetService?: AssetService;

constructor(..., assetService?: AssetService) {
  this.assetService = assetService;
}

// Then in inferVisualAnchors() or similar:

private async getVideos(searchTerms: string[]): Promise<string[]> {
  // If asset service available, use fallback
  if (this.assetService) {
    const fallbackAsset = await this.assetService.getVideoWithFallback(
      searchTerms,
      { 
        pexelsApi: this.pexelsApi,
        duration: 5
      }
    );
    
    if (fallbackAsset?.url) {
      return [fallbackAsset.url];
    }
    if (fallbackAsset?.path) {
      return [fallbackAsset.path];
    }
  }
  
  // Fallback to original logic
  return this.pexelsApi.findVideo(searchTerms, 5).then(url => url ? [url] : []);
}
*/

/**
 * STEP 5: Apply beat sync (optional, before render)
 * 
 * File: src/short-creator/ShortCreator.ts (in render() method)
 */

/*
// Before rendering, if beat sync enabled:

if (this.beatSync) {
  const syncedScenes = this.beatSync.syncScenesToBeats(scenes, {
    bpm: 120, // From music selection
    beatsPerBar: 4,
    enforceAlignment: false,  // Suggest only, don't force
  });
  
  scenes = this.beatSync.applySyncToScenes(syncedScenes);
  
  const stats = this.beatSync.getSyncStats(syncedScenes);
  logger.info(stats, "Beat sync applied");
}
*/

/**
 * STEP 6: Apply metadata generation after video creation
 * 
 * Could be in workers/PublishWorker.ts
 */

/*
// Before publishing, if metadata service enabled:

if (enhancedServices.metadata) {
  const metadata = enhancedServices.metadata.generateMetadata(
    scriptContent,    // from render job
    platform,         // youtube, instagram, etc
    {
      category: job.category,
      keywords: job.keywords,
      style: job.style,
    }
  );
  
  job.title = metadata.title;
  job.description = metadata.description;
  job.tags = metadata.hashtags;
}
*/

/**
 * ENVIRONMENT VARIABLES FOR FEATURE FLAGS
 */

/*
# Add to .env to enable features:

# Feedback loop: regenerate scripts if score is low
FEATURE_FEEDBACK_LOOP=false

# Memory: store high-performing patterns
FEATURE_MEMORY=false

# Predictive scoring: assess topics before generation
FEATURE_PREDICTIVE_SCORING=false

# Multi-source asset fallback
FEATURE_ASSET_FALLBACK=false

# Platform metadata generation
FEATURE_METADATA_GENERATION=false

# Beat sync for music alignment
FEATURE_BEAT_SYNC=false

# Agent loop: coordinate feedback/memory/prediction
FEATURE_AGENT_LOOP=false
*/

/**
 * ROLLOUT STRATEGY (Low-risk)
 * 
 * 1. Deploy all code with ALL features disabled (safe default)
 * 2. Test each feature in isolation:
 *    - Metadata generation (safest, no side effects)
 *    - Asset fallback (safe, only used if Pexels fails)
 *    - Beat sync (safe, optional enhancement)
 * 3. Then enable feedback loop (with careful monitoring)
 * 4. Then enable memory (verify storage integrity)
 * 5. Finally enable agent loop (full orchestration)
 *
 * Each step = 1-2 days validation before next.
 */

/**
 * SUCCESS CRITERIA
 * 
 * ✅ System runs without new services (backward compatible)
 * ✅ Each service works independently
 * ✅ Feature flags allow granular control
 * ✅ All new code is in new files (no file edits needed)
 * ✅ Existing tests still pass
 * ✅ Memory bounded (patterns pruned)
 * ✅ Graceful fallback if service fails
 * ✅ Logging throughout for debugging
 */
