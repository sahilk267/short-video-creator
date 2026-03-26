/**
 * useABTestResults Hook – fetch video list + variants for a selected video
 */

import { useState, useEffect, useCallback } from "react";
import { api, apiClient } from "../services/apiClient";

export interface ABVariant {
  id: string;
  videoId: string;
  variantKey: string;
  title: string;
  thumbnail?: string;
  assignedCount: number;
  clicks: number;
  createdAt: string;
  updatedAt: string;
}

export interface VideoEntry {
  id: string;
  status?: string;
}

export interface ABTestResultsState {
  videos: VideoEntry[];
  selectedVideoId: string;
  variants: ABVariant[];
  loadingVideos: boolean;
  loadingVariants: boolean;
  error: string | null;
  setSelectedVideoId: (id: string) => void;
  refresh: () => void;
}

function normalizeVideos(raw: unknown): VideoEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((v: Record<string, unknown>) => ({
    id: String(v.id || ""),
    status: v.status ? String(v.status) : undefined,
  }));
}

function normalizeVariants(raw: unknown): ABVariant[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((v: Record<string, unknown>) => ({
    id: String(v.id || ""),
    videoId: String(v.videoId || ""),
    variantKey: String(v.variantKey || ""),
    title: String(v.title || ""),
    thumbnail: v.thumbnail ? String(v.thumbnail) : undefined,
    assignedCount: Number(v.assignedCount ?? 0),
    clicks: Number(v.clicks ?? 0),
    createdAt: String(v.createdAt || new Date().toISOString()),
    updatedAt: String(v.updatedAt || new Date().toISOString()),
  }));
}

/** Compute CTR as clicks / max(1, assignedCount) */
export function computeCTR(variant: ABVariant): number {
  if (variant.assignedCount === 0) return 0;
  return Math.round((variant.clicks / variant.assignedCount) * 10000) / 100;
}

/** Identify winner (highest CTR, then highest assignedCount) */
export function findWinner(variants: ABVariant[]): string | null {
  if (variants.length === 0) return null;
  const sorted = [...variants].sort((a, b) => {
    const ctrDiff = computeCTR(b) - computeCTR(a);
    if (ctrDiff !== 0) return ctrDiff;
    return b.assignedCount - a.assignedCount;
  });
  return sorted[0].id;
}

export function useABTestResults(): ABTestResultsState {
  const [videos, setVideos] = useState<VideoEntry[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string>("");
  const [variants, setVariants] = useState<ABVariant[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    setLoadingVideos(true);
    setError(null);
    try {
      const raw = await api.videos.list();
      const list = normalizeVideos(raw);
      setVideos(list);
      if (list.length > 0 && !selectedVideoId) {
        setSelectedVideoId(list[0].id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load videos");
    } finally {
      setLoadingVideos(false);
    }
  }, [selectedVideoId]);

  const fetchVariants = useCallback(async () => {
    if (!selectedVideoId) {
      setVariants([]);
      return;
    }
    setLoadingVariants(true);
    setError(null);
    try {
      const raw = await apiClient.get(`/api/marketing/ab/variants/${selectedVideoId}`);
      setVariants(normalizeVariants(raw));
    } catch (err: unknown) {
      // 404 just means no variants yet — not an error worth surfacing
      setVariants([]);
    } finally {
      setLoadingVariants(false);
    }
  }, [selectedVideoId]);

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    fetchVariants();
  }, [selectedVideoId]);

  const refresh = useCallback(() => {
    fetchVideos();
    fetchVariants();
  }, [fetchVideos, fetchVariants]);

  return {
    videos,
    selectedVideoId,
    variants,
    loadingVideos,
    loadingVariants,
    error,
    setSelectedVideoId,
    refresh,
  };
}
