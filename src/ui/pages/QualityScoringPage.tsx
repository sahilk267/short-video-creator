import React, { useState } from "react";
import {
  Container,
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  LinearProgress,
  Chip,
  Stack,
} from "@mui/material";

interface QualityMetrics {
  audioQuality: number;
  visualQuality: number;
  scriptQuality: number;
  engagementPotential: number;
  technicalQuality: number;
  overallScore: number;
  issues: string[];
  recommendations: string[];
}

export function QualityScoringPage() {
  const [hasAudio, setHasAudio] = useState(true);
  const [audioLUFS, setAudioLUFS] = useState(-14);
  const [visualResolution, setVisualResolution] = useState(1920);
  const [frameRate, setFrameRate] = useState(30);
  const [scriptLength, setScriptLength] = useState(500);
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  const handleScore = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/quality/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hasAudio, audioLUFS, visualResolution, frameRate, scriptLength }),
      });
      const data = await res.json();
      setMetrics(data.metrics);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, color: "#6366f1" }}>
        Quality Scoring Engine
      </Typography>

      <Paper sx={{ p: 3, mb: 3, bgcolor: "#1e293b" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2, mb: 2 }}>
          <TextField
            type="number"
            label="Audio LUFS"
            value={audioLUFS}
            onChange={(e) => setAudioLUFS(Number(e.target.value))}
          />
          <TextField
            type="number"
            label="Visual Resolution (px)"
            value={visualResolution}
            onChange={(e) => setVisualResolution(Number(e.target.value))}
          />
          <TextField
            type="number"
            label="Frame Rate (fps)"
            value={frameRate}
            onChange={(e) => setFrameRate(Number(e.target.value))}
          />
          <TextField
            type="number"
            label="Script Length (chars)"
            value={scriptLength}
            onChange={(e) => setScriptLength(Number(e.target.value))}
          />
        </Box>

        <Button variant="contained" fullWidth onClick={handleScore} disabled={loading}>
          {loading ? "Scoring..." : "Score Quality"}
        </Button>
      </Paper>

      {metrics && (
        <Paper sx={{ p: 3, bgcolor: "#1e293b" }}>
          <Alert severity={metrics.overallScore > 0.75 ? "success" : metrics.overallScore > 0.5 ? "info" : "warning"} sx={{ mb: 3 }}>
            Overall Score: <strong>{(metrics.overallScore * 100).toFixed(0)}/100</strong>
          </Alert>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2, mb: 3 }}>
            {[
              { label: "Audio", value: metrics.audioQuality },
              { label: "Visual", value: metrics.visualQuality },
              { label: "Script", value: metrics.scriptQuality },
              { label: "Engagement", value: metrics.engagementPotential },
            ].map((item) => (
              <Box key={item.label}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2">{item.label}</Typography>
                  <Typography variant="body2" sx={{ color: "#f59e0b" }}>
                    {(item.value * 100).toFixed(0)}
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={item.value * 100} />
              </Box>
            ))}
          </Box>

          {metrics.issues.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 700, color: "#f59e0b" }}>
                Issues:
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                {metrics.issues.map((issue, i) => (
                  <Chip key={i} label={issue} color="error" size="small" />
                ))}
              </Stack>
            </Box>
          )}

          {metrics.recommendations.length > 0 && (
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 700, color: "#22c55e" }}>
                Recommendations:
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                {metrics.recommendations.map((rec, i) => (
                  <Chip key={i} label={rec} color="success" size="small" />
                ))}
              </Stack>
            </Box>
          )}
        </Paper>
      )}
    </Container>
  );
}
