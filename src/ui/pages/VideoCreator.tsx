import React, { Suspense, lazy, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { RenderConfig, SceneInput, MusicMoodEnum, CaptionPositionEnum, VoiceEnum, OrientationEnum, MusicVolumeEnum } from "../../types/shorts";
import type { AutoScriptStyle, NewsSourceOption } from "../components/video-creator/AutoScriptPanel";
import type { SceneFormData } from "../components/video-creator/SceneEditorList";
import type { HookOption } from "../../script-generator/AiLlmGenerator";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import apiClient from "../services/apiClient";

const AutoScriptPanel = lazy(() => import("../components/video-creator/AutoScriptPanel"));
const SceneEditorList = lazy(() => import("../components/video-creator/SceneEditorList"));
const VideoConfigPanel = lazy(() => import("../components/video-creator/VideoConfigPanel"));
const http = apiClient.getAxiosInstance();

const VideoCreator: React.FC = () => {
  const navigate = useNavigate();
  const [scenes, setScenes] = useState<SceneFormData[]>([
    { text: "", searchTerms: "", keywords: "", subcategory: "", headline: "", visualPrompt: "" },
  ]);
  const [config, setConfig] = useState<RenderConfig>({
    paddingBack: 1500,
    music: MusicMoodEnum.chill,
    captionPosition: CaptionPositionEnum.bottom,
    captionBackgroundColor: "blue",
    voice: VoiceEnum.af_heart,
    orientation: OrientationEnum.portrait,
    musicVolume: MusicVolumeEnum.high,
  });
  const [loading, setLoading] = useState(false);
  const [autoLoading, setAutoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sources, setSources] = useState<NewsSourceOption[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("World");
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<AutoScriptStyle>("News");
  const [hookOptions, setHookOptions] = useState<HookOption[]>([]);
  const [selectedHook, setSelectedHook] = useState("");
  const [keywordQuery, setKeywordQuery] = useState("");
  const [sourceSaving, setSourceSaving] = useState(false);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [hooksLoading, setHooksLoading] = useState(false);
  const [, setVoices] = useState<VoiceEnum[]>([]);
  const [, setMusicTags] = useState<MusicMoodEnum[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const selectedSourceLabel = selectedSources.length > 0
    ? sources.filter((source) => selectedSources.includes(source.id)).map((source) => source.name).join(", ")
    : "No source selected";
  const keywordList = keywordQuery.split(",").map((keyword) => keyword.trim()).filter(Boolean);
  const readinessSummary = {
    scenesWithText: scenes.filter((scene) => scene.text.trim().length >= 10).length,
    scenesWithMediaHints: scenes.filter((scene) => (
      scene.searchTerms.split(",").map((term) => term.trim()).filter(Boolean).length >= 2
    )).length,
    scenesWithHeadline: scenes.filter((scene) => scene.headline.trim().length > 0).length,
  };

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [voicesResponse, musicResponse, newsResponse] = await Promise.all([
          http.get("/api/voices"),
          http.get("/api/music-tags"),
          http.get("/api/news-sources"),
        ]);

        setVoices(voicesResponse.data);
        setMusicTags(musicResponse.data);
        setSources(newsResponse.data);
      } catch (err) {
        console.error("Failed to fetch options:", err);
        setError("Failed to load voices and music options. Please refresh the page.");
      } finally {
        setLoadingOptions(false);
      }
    };

    void fetchOptions();
  }, []);

  const reloadSources = async () => {
    const newsResponse = await http.get("/api/news-sources");
    setSources(newsResponse.data);
  };

  const fetchTrendingTopics = async (sourceIds: string[], category: string): Promise<string[]> => {
    setTopicsLoading(true);
    try {
      const res = await http.post("/api/auto-script/topics", { sourceIds, category, keywords: keywordList });
      const topics = Array.isArray(res.data?.topics) ? res.data.topics : [];
      setTrendingTopics(topics);
      setSelectedTopic((current) => (current && topics.includes(current) ? current : (topics[0] || "")));
      return topics;
    } finally {
      setTopicsLoading(false);
    }
  };

  const fetchHookOptions = async (
    sourceIds: string[],
    category: string,
    topic: string,
    style: AutoScriptStyle,
  ) => {
    if (sourceIds.length === 0) {
      setHookOptions([]);
      setSelectedHook("");
      return;
    }

    setHooksLoading(true);
    try {
      const res = await http.post("/api/auto-script/hooks", {
        sourceIds,
        category,
        topic,
        style,
        keywords: keywordList,
      });
      const hooks = Array.isArray(res.data?.hooks) ? res.data.hooks : [];
      setHookOptions(hooks);
      setSelectedHook((current) => (
        current && hooks.some((hook: HookOption) => hook.text === current)
          ? current
          : (hooks[0]?.text || "")
      ));
    } finally {
      setHooksLoading(false);
    }
  };

  const refreshAutomationOptions = async () => {
    if (selectedSources.length === 0) {
      return;
    }

    setError(null);
    try {
      const topics = await fetchTrendingTopics(selectedSources, selectedCategory);
      await fetchHookOptions(
        selectedSources,
        selectedCategory,
        selectedTopic || topics[0] || "",
        selectedStyle,
      );
    } catch (err) {
      console.error("Failed to fetch topics:", err);
      setError("Failed to load trending topics for this source.");
    }
  };

  useEffect(() => {
    if (selectedSources.length === 0) {
      setTrendingTopics([]);
      setSelectedTopic("");
      setHookOptions([]);
      setSelectedHook("");
      return;
    }

    void refreshAutomationOptions();
  }, [selectedSources, selectedCategory]);

  useEffect(() => {
    if (selectedSources.length === 0) {
      return;
    }

    void (async () => {
      try {
        await fetchHookOptions(selectedSources, selectedCategory, selectedTopic, selectedStyle);
      } catch (err) {
        console.error("Failed to fetch hooks:", err);
        setError("Failed to load hook options.");
      }
    })();
  }, [selectedSources, selectedCategory, selectedTopic, selectedStyle]);

  const handleAddScene = () => {
    setScenes((current) => [...current, { text: "", searchTerms: "", keywords: "", subcategory: "", headline: "", visualPrompt: "" }]);
  };

  const handleCreateCustomSource = async (payload: {
    name: string;
    url: string;
    category: string;
    subCategory?: string;
  }) => {
    setSourceSaving(true);
    setError(null);
    try {
      const response = await http.post("/api/news-sources/custom", payload);
      await reloadSources();
      if (response.data?.source?.id) {
        setSelectedSources((current) => Array.from(new Set([...current, response.data.source.id])));
      }
    } catch (err: any) {
      console.error("Failed to create custom source:", err);
      setError(err.response?.data?.error || err.message || "Failed to add custom source");
      throw err;
    } finally {
      setSourceSaving(false);
    }
  };

  const handleRemoveScene = (index: number) => {
    if (scenes.length <= 1) {
      return;
    }

    setScenes((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleAutoScript = async () => {
    if (selectedSources.length === 0) return;
    setAutoLoading(true);
    setError(null);
    try {
      const res = await http.post("/api/auto-script", {
        sourceIds: selectedSources,
        category: selectedCategory,
        topic: selectedTopic || undefined,
        style: selectedStyle,
        hook: selectedHook || undefined,
        keywords: keywordList,
      });
      if (res.data.scenes) {
        setScenes(res.data.scenes.map((scene: any) => ({
          text: scene.text,
          searchTerms: Array.isArray(scene.searchTerms) ? scene.searchTerms.join(", ") : scene.searchTerms,
          keywords: Array.isArray(scene.keywords) ? scene.keywords.join(", ") : "",
          subcategory: scene.subcategory || "",
          headline: scene.headline || "",
          visualPrompt: scene.visualPrompt || "",
        })));
      }
    } catch (err: any) {
      console.error("AI LLM auto-script error:", err);
      const message = err.response?.data?.message || err.message || "Failed to generate script";
      const rawOutput = err.response?.data?.rawAI_LLMOutput;
      setError(`${message}${rawOutput ? ` | RAW OUTPUT: ${JSON.stringify(rawOutput)}` : ""}`);
    } finally {
      setAutoLoading(false);
    }
  };

  const handleSceneChange = (index: number, field: keyof SceneFormData, value: string) => {
    setScenes((current) => current.map((scene, currentIndex) => (
      currentIndex === index
        ? { ...scene, [field]: value }
        : scene
    )));
  };

  const handleConfigChange = <K extends keyof RenderConfig>(field: K, value: RenderConfig[K]) => {
    setConfig((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const apiScenes: SceneInput[] = scenes.map((scene) => ({
        text: scene.text,
        subcategory: scene.subcategory.trim() || undefined,
        keywords: scene.keywords
          .split(",")
          .map((term) => term.trim())
          .filter((term) => term.length > 0),
        headline: scene.headline.trim() || undefined,
        visualPrompt: scene.visualPrompt.trim() || undefined,
        searchTerms: scene.searchTerms
          .split(",")
          .map((term) => term.trim())
          .filter((term) => term.length > 0),
      }));

      const response = await http.post("/api/short-video", {
        scenes: apiScenes,
        config,
      });

      navigate(`/video/${response.data.videoId}`);
    } catch (err) {
      console.error(err);
      setError("Failed to create video. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingOptions) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box maxWidth="md" mx="auto" py={4}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: "bold", textAlign: "center", mb: 4 }}>
        Create New Video
      </Typography>

      <Suspense fallback={<LoadingSpinner message="Loading creator tools..." />}>
        <AutoScriptPanel
          autoLoading={autoLoading}
          topicsLoading={topicsLoading}
          hooksLoading={hooksLoading}
          sourceSaving={sourceSaving}
          selectedCategory={selectedCategory}
          selectedSources={selectedSources}
          selectedTopic={selectedTopic}
          selectedStyle={selectedStyle}
          selectedHook={selectedHook}
          keywordQuery={keywordQuery}
          sources={sources}
          trendingTopics={trendingTopics}
          hookOptions={hookOptions}
          onCategoryChange={(category) => {
            setSelectedCategory(category);
            setSelectedSources([]);
            setTrendingTopics([]);
            setSelectedTopic("");
            setHookOptions([]);
            setSelectedHook("");
          }}
          onSourceChange={setSelectedSources}
          onTopicChange={setSelectedTopic}
          onStyleChange={setSelectedStyle}
          onHookChange={setSelectedHook}
          onKeywordChange={setKeywordQuery}
          onAutoRefresh={() => void refreshAutomationOptions()}
          onGenerate={() => void handleAutoScript()}
          onCreateSource={handleCreateCustomSource}
        />
      </Suspense>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2.5, mb: 3, bgcolor: "grey.50", border: "1px solid", borderColor: "divider" }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          Quick Summary
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} useFlexGap flexWrap="wrap">
          <Typography variant="body2">
            Scenes: <strong>{scenes.length}</strong>
          </Typography>
          <Typography variant="body2">
            Orientation: <strong>{config.orientation}</strong>
          </Typography>
          <Typography variant="body2">
            Voice: <strong>{config.voice}</strong>
          </Typography>
          <Typography variant="body2">
            Source: <strong>{selectedSourceLabel}</strong>
          </Typography>
          <Typography variant="body2">
            AI images: <strong>{config.useAiImages ? "On" : "Off"}</strong>
          </Typography>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2.5, mb: 3, bgcolor: "rgba(25, 118, 210, 0.04)", border: "1px solid", borderColor: "divider" }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          Render Readiness
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} useFlexGap flexWrap="wrap">
          <Typography variant="body2">
            Audio-ready scenes: <strong>{readinessSummary.scenesWithText}/{scenes.length}</strong>
          </Typography>
          <Typography variant="body2">
            Subtitle-ready scenes: <strong>{readinessSummary.scenesWithText}/{scenes.length}</strong>
          </Typography>
          <Typography variant="body2">
            Media-ready scenes: <strong>{readinessSummary.scenesWithMediaHints}/{scenes.length}</strong>
          </Typography>
          <Typography variant="body2">
            Headline coverage: <strong>{readinessSummary.scenesWithHeadline}/{scenes.length}</strong>
          </Typography>
        </Stack>
      </Paper>

      <form onSubmit={(event) => void handleSubmit(event)}>
        <Suspense fallback={<LoadingSpinner message="Loading scene editor..." />}>
          <SceneEditorList
            scenes={scenes}
            category={selectedCategory}
            voice={config.voice}
            captionPosition={config.captionPosition}
            captionBackgroundColor={config.captionBackgroundColor}
            onAddScene={handleAddScene}
            onRemoveScene={handleRemoveScene}
            onSceneChange={handleSceneChange}
          />
        </Suspense>

        <Divider sx={{ mb: 4 }} />

        <Suspense fallback={<LoadingSpinner message="Loading video settings..." />}>
        <VideoConfigPanel
          config={config}
          onConfigChange={handleConfigChange}
        />
        </Suspense>

        <Box display="flex" justifyContent="center">
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            disabled={loading}
            sx={{ minWidth: 200 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Create Video"}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default VideoCreator;
