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
import type { NewsSourceOption } from "../components/video-creator/AutoScriptPanel";
import type { SceneFormData } from "../components/video-creator/SceneEditorList";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import apiClient from "../services/apiClient";

const AutoScriptPanel = lazy(() => import("../components/video-creator/AutoScriptPanel"));
const SceneEditorList = lazy(() => import("../components/video-creator/SceneEditorList"));
const VideoConfigPanel = lazy(() => import("../components/video-creator/VideoConfigPanel"));
const http = apiClient.getAxiosInstance();

const VideoCreator: React.FC = () => {
  const navigate = useNavigate();
  const [scenes, setScenes] = useState<SceneFormData[]>([
    { text: "", searchTerms: "", headline: "", visualPrompt: "" },
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
  const [selectedSource, setSelectedSource] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("World");
  const [, setVoices] = useState<VoiceEnum[]>([]);
  const [, setMusicTags] = useState<MusicMoodEnum[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const selectedSourceLabel = sources.find((source) => source.id === selectedSource)?.name ?? "No source selected";

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

  const handleAddScene = () => {
    setScenes((current) => [...current, { text: "", searchTerms: "", headline: "", visualPrompt: "" }]);
  };

  const handleRemoveScene = (index: number) => {
    if (scenes.length <= 1) {
      return;
    }

    setScenes((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleAutoScript = async () => {
    if (!selectedSource) return;
    setAutoLoading(true);
    setError(null);
    try {
      const res = await http.post("/api/auto-script", { sourceId: selectedSource });
      if (res.data.scenes) {
        setScenes(res.data.scenes.map((scene: any) => ({
          text: scene.text,
          searchTerms: Array.isArray(scene.searchTerms) ? scene.searchTerms.join(", ") : scene.searchTerms,
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
          selectedCategory={selectedCategory}
          selectedSource={selectedSource}
          sources={sources}
          onCategoryChange={(category) => {
            setSelectedCategory(category);
            setSelectedSource("");
          }}
          onSourceChange={setSelectedSource}
          onGenerate={() => void handleAutoScript()}
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

      <form onSubmit={(event) => void handleSubmit(event)}>
        <Suspense fallback={<LoadingSpinner message="Loading scene editor..." />}>
          <SceneEditorList
            scenes={scenes}
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
