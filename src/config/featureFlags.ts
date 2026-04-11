/**
 * Feature Flags - Control experimental features safely
 * All new features are behind flags to maintain backward compatibility
 */

export interface FeatureFlags {
  // Feedback loop: regenerate scripts if score is low
  enableFeedbackLoop: boolean;

  // Memory system: store and reuse high-performing patterns
  enableMemory: boolean;

  // Predictive scoring: evaluate topic viability BEFORE generation
  enablePredictiveScoring: boolean;

  // Multi-source fallback: try alternative asset sources if Pexels fails
  enableAssetFallback: boolean;

  // Platform metadata: auto-generate titles/descriptions per platform
  enableMetadataGeneration: boolean;

  // Beat sync: align scene durations to music beats
  enableBeatSync: boolean;

  // Agent loop: minimal retry loop with evaluation
  enableAgentLoop: boolean;

  // NEW: Decision Engine - intelligent decisions instead of blind retry
  enableDecisionEngine: boolean;

  // NEW: Goal System - drive behavior based on goals (speed vs quality)
  enableGoalSystem: boolean;
}

/**
 * Default feature flags - conservative defaults to avoid breaking changes
 */
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  enableFeedbackLoop: process.env.FEATURE_FEEDBACK_LOOP === "true" || false,
  enableMemory: process.env.FEATURE_MEMORY === "true" || false,
  enablePredictiveScoring: process.env.FEATURE_PREDICTIVE_SCORING === "true" || false,
  enableAssetFallback: process.env.FEATURE_ASSET_FALLBACK === "true" || false,
  enableMetadataGeneration: process.env.FEATURE_METADATA_GENERATION === "true" || false,
  enableBeatSync: process.env.FEATURE_BEAT_SYNC === "true" || false,
  enableAgentLoop: process.env.FEATURE_AGENT_LOOP === "true" || false,
  enableDecisionEngine: process.env.FEATURE_DECISION_ENGINE === "true" || false,
  enableGoalSystem: process.env.FEATURE_GOAL_SYSTEM === "true" || false,
};

/**
 * Production-safe features (can be enabled by default)
 */
export const SAFE_PRODUCTION_FLAGS: FeatureFlags = {
  enableFeedbackLoop: false,      // Still experimental
  enableMemory: false,             // Needs validation
  enablePredictiveScoring: false,  // Depends on data
  enableAssetFallback: true,       // Safe fallback mechanism
  enableMetadataGeneration: false, // Platform-specific testing needed
  enableBeatSync: false,           // Complex feature
  enableAgentLoop: false,          // Experimental
  enableDecisionEngine: false,     // NEW: Requires testing
  enableGoalSystem: false,         // NEW: Requires tuning
};

export function getFeatureFlags(): FeatureFlags {
  return {
    ...DEFAULT_FEATURE_FLAGS,
  };
}
