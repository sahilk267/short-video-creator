/**
 * Enhanced Features Types & Interfaces
 * 
 * Import from here for full TypeScript support with new services
 */

// Feature Flags
export type FeatureFlag =
  | "enableFeedbackLoop"
  | "enableMemory"
  | "enablePredictiveScoring"
  | "enableAssetFallback"
  | "enableMetadataGeneration"
  | "enableBeatSync"
  | "enableAgentLoop";

// Memory Service Types
export type StoredPatternStyle = "News" | "Viral" | "Explainer";

export interface StoredPattern {
  id: string;
  category: string;
  topic?: string;
  script: string;
  score: number;
  style: StoredPatternStyle;
  engagement?: {
    views: number;
    likes: number;
    shares: number;
  };
  keywords: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PatternQuery {
  category: string;
  style?: string;
  minScore?: number;
  limit?: number;
}

export interface MemoryStats {
  totalPatterns: number;
  byCategory: Record<string, number>;
  topScores: Array<{ category: string; score: number }>;
}

// Feedback Service Types
export type IssueType = "hook" | "engagement" | "clarity" | "length" | "keywords";
export type IssueSeverity = "low" | "medium" | "high";

export interface ScriptQualityIssue {
  type: IssueType;
  severity: IssueSeverity;
  message: string;
}

export interface FeedbackContext {
  script: string;
  score: number;
  issues: ScriptQualityIssue[];
  category: string;
  style: StoredPatternStyle;
  keywords?: string[];
  topic?: string;
}

// Asset Service Types
export type AssetSourceType = "web" | "local";

export interface AssetSource {
  name: string;
  type: AssetSourceType;
  priority: number;
  available: boolean;
}

export interface FallbackAsset {
  source: string;
  keywords: string[];
  path?: string;
  url?: string;
  duration?: number;
}

export interface AssetStats {
  totalAssets: number;
  byExtension: Record<string, number>;
}

// Metadata Service Types
export type PlatformType = "youtube" | "instagram" | "tiktok" | "telegram" | "facebook";

export interface PlatformMetadata {
  title: string;
  description: string;
  hashtags: string[];
  platform: PlatformType;
  keywords: string[];
}

export interface PlatformLimits {
  maxTitleLength: number;
  maxDescriptionLength: number;
  maxHashtagCount: number;
  maxHashtagLength: number;
  supportEmojis: boolean;
}

// Predictive Service Types
export type ViabilityRecommendation = "generate" | "risky" | "reject";

export interface ViabilityAssessment {
  score: number;
  confidence: number;
  recommendation: ViabilityRecommendation;
  reasons: string[];
}

export interface EngagementPrediction {
  engagementScore: number;
  advice: string;
}

// Beat Sync Service Types
export interface BeatSyncConfig {
  bpm: number;
  beatsPerBar: number;
  enforceAlignment: boolean;
}

export interface SyncedScene {
  original: Scene;
  adjustedDurationMs: number;
  beatAlignment: number;
  suggestion?: string;
}

export interface SyncStats {
  avgAlignment: number;
  wellAlignedCount: number;
  suggestionsCount: number;
  totalAdjustmentMs: number;
}

// Agent Loop Types
export interface AgentLoopConfig {
  maxRetries: number;
  scoreThreshold: number;
  enableMemory: boolean;
  enablePrediction: boolean;
  enableFeedback: boolean;
}

export interface GenerationAttempt {
  attemptNumber: number;
  script: string;
  score: number;
  issues?: Array<{ type: string; message: string }>;
  duration?: number;
}

export interface AgentResult {
  finalScript: string;
  finalScore: number;
  attempts: GenerationAttempt[];
  improved: boolean;
  memoryUsed?: boolean;
  fallbackUsed?: boolean;
}

export interface GenerationContext {
  category: string;
  topic: string;
  keywords?: string[];
  style?: StoredPatternStyle;
}

// Import from existing types
import type { Scene } from "./types/shorts";

// Service Registry (used in DI)
export interface EnhancedServicesRegistry {
  flags: Record<FeatureFlag, boolean>;
  memory?: any; // MemoryService type
  feedback?: any; // FeedbackService type
  predictive?: any; // PredictiveService type
  assets?: any; // AssetService type
  metadata?: any; // MetadataService type
  beatSync?: any; // BeatSyncService type
  agentLoop?: any; // AgentLoopService type
}

// Hook Options (already exists in AiLlmGenerator, included for reference)
export interface HookOption {
  text: string;
  score: number;
  scoreLabel: "Strong" | "Good" | "Experimental";
  rationale: string;
}

// Export all as namespace for convenience
export namespace EnhancedFeatures {
  export type Feature = FeatureFlag;
  export type Platform = PlatformType;
  export type Recommendation = ViabilityRecommendation;
  export type Style = StoredPatternStyle;

  export const PLATFORMS: PlatformType[] = [
    "youtube",
    "instagram",
    "tiktok",
    "telegram",
    "facebook",
  ];

  export const STYLES: StoredPatternStyle[] = ["News", "Viral", "Explainer"];

  export const ALL_FEATURES: FeatureFlag[] = [
    "enableFeedbackLoop",
    "enableMemory",
    "enablePredictiveScoring",
    "enableAssetFallback",
    "enableMetadataGeneration",
    "enableBeatSync",
    "enableAgentLoop",
  ];

  export const SAFE_PRODUCTION_FEATURES: FeatureFlag[] = [
    "enableAssetFallback",
    "enableMetadataGeneration",
  ];

  export const EXPERIMENTAL_FEATURES: FeatureFlag[] = [
    "enableFeedbackLoop",
    "enableMemory",
    "enableBeatSync",
    "enableAgentLoop",
  ];

  export const REQUIRES_MEMORY: FeatureFlag[] = [
    "enableAgentLoop",
    "enableMemory",
  ];

  export const REQUIRES_FEEDBACK: FeatureFlag[] = [
    "enableFeedbackLoop",
    "enableAgentLoop",
  ];
}

/**
 * Usage examples:
 * 
 * import { MemoryStats, PlatformMetadata, EnhancedFeatures } from './enhanced-types';
 * 
 * const stats: MemoryStats = { ... };
 * const metadata: PlatformMetadata = { ... };
 * const platforms: EnhancedFeatures.Platform[] = EnhancedFeatures.PLATFORMS;
 * 
 * if (EnhancedFeatures.ALL_FEATURES.length > 0) {
 *   // At least one feature available
 * }
 */
