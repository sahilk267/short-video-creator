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
  Slider,
} from "@mui/material";

interface AttentionOptimization {
  hookLength: number;
  paceMultiplier: number;
  transitionFrequency: number;
  musicIntensity: number;
  visualChangeFrequency: number;
  estimatedRetention: number;
}

export function AttentionOptimizerPage() {
  const [duration, setDuration] = useState(30);
  const [platform, setPlatform] = useState<"tiktok" | "instagram" | "youtube" | "youtube_shorts">("tiktok");
  const [optimization, setOptimization] = useState<AttentionOptimization | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/attention/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration, platform }),
      });
      const data = await res.json();
      setOptimization(data.optimization);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, color: "#6366f1" }}>
        Attention Optimizer Engine
      </Typography>

      <Paper sx={{ p: 3, mb: 3, bgcolor: "#1e293b" }}>
        <Box sx={{ mb: 3 }}>
          <Typography gutterBottom>
            Video Duration: <strong>{duration}s</strong>
          </Typography>
          <Slider
            value={duration}
            onChange={(_, v) => setDuration(v as number)}
            min={5}
            max={300}
            step={5}
            marks={[
              { value: 5, label: "5s" },
              { value: 60, label: "1m" },
              { value: 300, label: "5m" },
            ]}
          />
        </Box>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Platform</InputLabel>
          <Select value={platform} label="Platform" onChange={(e) => setPlatform(e.target.value as any)}>
            <MenuItem value="tiktok">TikTok</MenuItem>
            <MenuItem value="instagram">Instagram</MenuItem>
            <MenuItem value="youtube">YouTube</MenuItem>
            <MenuItem value="youtube_shorts">YouTube Shorts</MenuItem>
          </Select>
        </FormControl>

        <Button variant="contained" fullWidth onClick={handleOptimize} disabled={loading}>
          {loading ? "Optimizing..." : "Optimize Attention"}
        </Button>
      </Paper>

      {optimization && (
        <Paper sx={{ p: 3, bgcolor: "#1e293b" }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            Optimization complete! Expected retention: {(optimization.estimatedRetention * 100).toFixed(0)}%
          </Alert>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Hook Length: {optimization.hookLength.toFixed(1)}s
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Pace Multiplier: {optimization.paceMultiplier.toFixed(2)}x
              </Typography>
              <Typography variant="body2">
                Transition Frequency: {optimization.transitionFrequency.toFixed(0)} per minute
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Music Intensity: {optimization.musicIntensity.toFixed(2)}/1.0
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Visual Change Frequency: {optimization.visualChangeFrequency.toFixed(1)}x per minute
              </Typography>
              <Typography variant="body2" sx={{ color: "#22c55e" }}>
                Estimated Retention: {(optimization.estimatedRetention * 100).toFixed(0)}%
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}
    </Container>
  );
}
