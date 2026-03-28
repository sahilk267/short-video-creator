import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import type { CaptionPositionEnum, VoiceEnum } from "../../../types/shorts";
import type { SceneFormData } from "./SceneEditorList";

interface ScenePreviewPanelProps {
  scene: SceneFormData;
  sceneIndex: number;
  voice: VoiceEnum;
  captionPosition: CaptionPositionEnum;
  captionBackgroundColor: string;
}

const splitIntoPreviewLines = (text: string): string[] => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [];
  }

  const lines: string[] = [];
  for (let index = 0; index < words.length; index += 4) {
    lines.push(words.slice(index, index + 4).join(" "));
    if (lines.length === 3) {
      break;
    }
  }

  return lines;
};

const buildMediaHints = (scene: SceneFormData): string[] => {
  return Array.from(new Set(
    [
      scene.subcategory,
      scene.headline,
      ...scene.keywords.split(","),
      ...scene.searchTerms.split(","),
    ]
      .map((item) => item.trim())
      .filter(Boolean),
  )).slice(0, 6);
};

const ScenePreviewPanel: React.FC<ScenePreviewPanelProps> = ({
  scene,
  sceneIndex,
  voice,
  captionPosition,
  captionBackgroundColor,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const subtitleLines = useMemo(() => splitIntoPreviewLines(scene.text), [scene.text]);
  const mediaHints = useMemo(() => buildMediaHints(scene), [scene]);
  const readiness = {
    audio: scene.text.trim().length >= 10,
    subtitles: scene.text.trim().length >= 10,
    media: mediaHints.length >= 2,
  };

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePlayPreview = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !scene.text.trim()) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(scene.text.trim());
    utterance.rate = 1;
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleStopPreview = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  return (
    <Paper variant="outlined" sx={{ p: 2.5, bgcolor: "grey.50" }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            Scene {sceneIndex + 1} Preview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Browser narration preview, subtitle layout preview, and render-readiness hints.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<PlayArrowIcon />}
            onClick={handlePlayPreview}
            disabled={!readiness.audio || isPlaying}
          >
            Audio Preview
          </Button>
          <Button
            variant="text"
            color="inherit"
            startIcon={<StopIcon />}
            onClick={handleStopPreview}
            disabled={!isPlaying}
          >
            Stop
          </Button>
        </Stack>
      </Stack>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
        <Chip
          color={readiness.audio ? "success" : "default"}
          label={readiness.audio ? `Audio Ready • ${voice}` : "Audio needs scene text"}
        />
        <Chip
          color={readiness.subtitles ? "success" : "default"}
          label={readiness.subtitles ? `Subtitle Ready • ${captionPosition}` : "Subtitle needs scene text"}
        />
        <Chip
          color={readiness.media ? "success" : "warning"}
          label={readiness.media ? `Media Ready • ${mediaHints.length} cues` : "Media cues are weak"}
        />
      </Stack>

      <Stack spacing={2}>
        <Box>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Subtitle Preview
          </Typography>
          <Box
            sx={{
              minHeight: 116,
              borderRadius: 2,
              bgcolor: "#101723",
              color: "white",
              p: 2,
              display: "flex",
              flexDirection: "column",
              justifyContent: captionPosition === "top"
                ? "flex-start"
                : (captionPosition === "center" ? "center" : "flex-end"),
              alignItems: "center",
              gap: 1,
            }}
          >
            {subtitleLines.length > 0 ? subtitleLines.map((line, index) => (
              <Typography
                key={`${line}-${index}`}
                sx={{
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                  fontSize: { xs: "1rem", md: "1.2rem" },
                }}
              >
                {index === subtitleLines.length - 1 ? (
                  <Box component="span" sx={{ bgcolor: captionBackgroundColor, px: 1, py: 0.4, borderRadius: 1 }}>
                    {line}
                  </Box>
                ) : line}
              </Typography>
            )) : (
              <Typography variant="body2" color="rgba(255,255,255,0.72)">
                Enter scene text to preview subtitle layout.
              </Typography>
            )}
          </Box>
        </Box>

        <Box>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Media Hints
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {mediaHints.length > 0 ? mediaHints.map((hint) => (
              <Chip key={hint} size="small" variant="outlined" label={hint} />
            )) : (
              <Typography variant="body2" color="text.secondary">
                Add subcategory, keywords, headline, or search terms to improve background selection.
              </Typography>
            )}
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
};

export default ScenePreviewPanel;
