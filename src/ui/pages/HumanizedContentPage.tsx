import React, { useState } from "react";
import {
  Container,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
} from "@mui/material";

interface HumanizedResult {
  talkingHeadEnabled: boolean;
  emotionTone: string;
  pauseMilliseconds: number[];
  voiceSettings: { pitch: number; speed: number; emotion: string };
  gesturePoints: Array<{ time: number; gesture: string }>;
  eyeMovement: Array<{ time: number; direction: string }>;
}

export function HumanizedContentPage() {
  const [script, setScript] = useState("");
  const [emotion, setEmotion] = useState<"excited" | "calm" | "urgent" | "informative" | "humorous">("excited");
  const [result, setResult] = useState<HumanizedResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleHumanize = async () => {
    if (!script.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/humanized/humanize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script, emotion }),
      });
      const data = await res.json();
      setResult(data.result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, color: "#6366f1" }}>
        Humanized Content Engine
      </Typography>

      <Paper sx={{ p: 3, mb: 3, bgcolor: "#1e293b" }}>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Video Script"
          value={script}
          onChange={(e) => setScript(e.target.value)}
          sx={{ mb: 2 }}
          placeholder="Enter your video script here..."
        />

        <FormControl sx={{ minWidth: 200, mb: 2 }}>
          <InputLabel>Emotion Tone</InputLabel>
          <Select value={emotion} label="Emotion Tone" onChange={(e) => setEmotion(e.target.value as any)}>
            <MenuItem value="excited">Excited</MenuItem>
            <MenuItem value="calm">Calm</MenuItem>
            <MenuItem value="urgent">Urgent</MenuItem>
            <MenuItem value="informative">Informative</MenuItem>
            <MenuItem value="humorous">Humorous</MenuItem>
          </Select>
        </FormControl>

        <Button variant="contained" onClick={handleHumanize} disabled={loading}>
          {loading ? "Processing..." : "Humanize Content"}
        </Button>
      </Paper>

      {result && (
        <Paper sx={{ p: 3, bgcolor: "#1e293b" }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            Content humanized successfully!
          </Alert>

          <Typography variant="h6" sx={{ mb: 2, color: "#f59e0b" }}>
            Voice Settings
          </Typography>
          <Box sx={{ ml: 2, mb: 2 }}>
            <Typography>Pitch: {result.voiceSettings.pitch.toFixed(2)}</Typography>
            <Typography>Speed: {result.voiceSettings.speed.toFixed(2)}x</Typography>
            <Typography>Emotion: {result.voiceSettings.emotion}</Typography>
          </Box>

          <Typography variant="h6" sx={{ mb: 2, color: "#f59e0b" }}>
            Pause Points
          </Typography>
          <Box sx={{ ml: 2, mb: 2 }}>
            {result.pauseMilliseconds.slice(0, 5).map((p, i) => (
              <Typography key={i}>
                Pause {i + 1}: {p.toFixed(0)}ms
              </Typography>
            ))}
            {result.pauseMilliseconds.length > 5 && (
              <Typography variant="caption">... and {result.pauseMilliseconds.length - 5} more</Typography>
            )}
          </Box>

          <Typography variant="h6" sx={{ mb: 2, color: "#f59e0b" }}>
            Gestures
          </Typography>
          <Box sx={{ ml: 2 }}>
            {result.gesturePoints.slice(0, 5).map((g, i) => (
              <Typography key={i}>
                {g.gesture} @ {g.time}ms
              </Typography>
            ))}
          </Box>
        </Paper>
      )}
    </Container>
  );
}
