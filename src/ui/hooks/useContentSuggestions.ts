import useMutation from "./useMutation";
import { api } from "../services/apiClient";

// ── Response shapes ───────────────────────────────────────────────────────────

export interface IdeaItem {
  title: string;
  description?: string;
  tags?: string[];
  trendScore?: number;
}

export interface IdeationResult {
  ideas: IdeaItem[];
  category?: string;
  generatedAt?: string;
}

export interface EditingSuggestion {
  type: string;
  description: string;
  intensity?: string;
}

export interface EditingResult {
  suggestions: EditingSuggestion[];
  intensity?: string;
}

export interface ModerationResult {
  safe: boolean;
  flags: string[];
  score?: number;
  details?: string;
}

export interface AccessibilityResult {
  captions?: string;
  audioDescription?: string;
  altText?: string;
  score?: number;
  recommendations?: string[];
}

export interface TrendTag {
  tag: string;
  score?: number;
}

export interface TrendOptimizeResult {
  tags: TrendTag[];
  platform?: string;
}

// ── Request shapes ────────────────────────────────────────────────────────────

export interface IdeationPayload {
  category: string;
  platform?: string;
  count?: number;
  style?: string;
}

export interface EditingPayload {
  script?: string;
  intensity?: "low" | "medium" | "high";
  style?: string;
}

export interface PersonalizePayload {
  script: string;
  preferences?: Record<string, string>;
  audience?: string;
}

export interface TrendOptimizePayload {
  title?: string;
  description?: string;
  category?: string;
  platform?: string;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useIdeationMutation() {
  return useMutation<IdeationResult, IdeationPayload>(
    (payload) => api.content.ideate(payload) as Promise<IdeationResult>,
  );
}

export function useEditingSuggestionsMutation() {
  return useMutation<EditingResult, EditingPayload>(
    (payload) => api.content.getEditingSuggestions(payload) as Promise<EditingResult>,
  );
}

export function useModerationMutation() {
  return useMutation<ModerationResult, { text: string }>(
    (payload) => api.content.moderate(payload.text) as Promise<ModerationResult>,
  );
}

export function useAccessibilityMutation() {
  return useMutation<AccessibilityResult, { script: string }>(
    (payload) => api.content.getAccessibility(payload.script) as Promise<AccessibilityResult>,
  );
}

export function useTrendOptimizeMutation() {
  return useMutation<TrendOptimizeResult, TrendOptimizePayload>(
    (payload) => api.content.optimizeByTrends(payload) as Promise<TrendOptimizeResult>,
  );
}

export function usePersonalizeMutation() {
  return useMutation<{ script: string }, PersonalizePayload>(
    (payload) => api.content.personalize(payload) as Promise<{ script: string }>,
  );
}

export function useInteractiveMutation() {
  return useMutation<{ overlays: unknown[] }, unknown>(
    (payload) => api.content.addInteractive(payload) as Promise<{ overlays: unknown[] }>,
  );
}
