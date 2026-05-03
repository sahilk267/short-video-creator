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

interface AccountMetrics {
  totalVideos: number;
  totalViews: number;
  averageEngagement: number;
  followersGained: number;
  accountHealth: number;
  accountTier: "starter" | "growth" | "professional" | "elite";
}

export function AccountManagerPage() {
  const [totalVideos, setTotalVideos] = useState(10);
  const [totalViews, setTotalViews] = useState(5000);
  const [totalEngagement, setTotalEngagement] = useState(250);
  const [followersGained, setFollowersGained] = useState(50);
  const [metrics, setMetrics] = useState<AccountMetrics | null>(null);
  const [guidance, setGuidance] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/account/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalVideos, totalViews, totalEngagement, followersGained }),
      });
      const data = await res.json();
      setMetrics(data.metrics);

      const guidanceRes = await fetch("/api/account/guidance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metrics: data.metrics }),
      });
      const guidanceData = await guidanceRes.json();
      setGuidance(guidanceData.guidance);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const tierColors: Record<string, string> = {
    starter: "#94a3b8",
    growth: "#22c55e",
    professional: "#3b82f6",
    elite: "#f59e0b",
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, color: "#6366f1" }}>
        Account Manager Engine
      </Typography>

      <Paper sx={{ p: 3, mb: 3, bgcolor: "#1e293b" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2, mb: 2 }}>
          <TextField
            type="number"
            label="Total Videos"
            value={totalVideos}
            onChange={(e) => setTotalVideos(Number(e.target.value))}
          />
          <TextField
            type="number"
            label="Total Views"
            value={totalViews}
            onChange={(e) => setTotalViews(Number(e.target.value))}
          />
          <TextField
            type="number"
            label="Total Engagement"
            value={totalEngagement}
            onChange={(e) => setTotalEngagement(Number(e.target.value))}
          />
          <TextField
            type="number"
            label="Followers Gained"
            value={followersGained}
            onChange={(e) => setFollowersGained(Number(e.target.value))}
          />
        </Box>

        <Button variant="contained" fullWidth onClick={handleCalculate} disabled={loading}>
          {loading ? "Calculating..." : "Calculate Metrics"}
        </Button>
      </Paper>

      {metrics && (
        <Paper sx={{ p: 3, bgcolor: "#1e293b" }}>
          <Alert
            severity={metrics.accountHealth > 70 ? "success" : metrics.accountHealth > 40 ? "info" : "warning"}
            sx={{ mb: 3 }}
          >
            Account Tier: <strong>{metrics.accountTier.toUpperCase()}</strong> · Health:{" "}
            <strong>{metrics.accountHealth.toFixed(0)}/100</strong>
          </Alert>

          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="body2">Account Health</Typography>
              <Typography variant="body2" sx={{ color: "#f59e0b" }}>
                {metrics.accountHealth.toFixed(0)}/100
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={metrics.accountHealth} />
          </Box>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3 }}>
            {[
              { label: "Total Videos", value: metrics.totalVideos },
              { label: "Total Views", value: metrics.totalViews.toLocaleString() },
              { label: "Avg Engagement", value: (metrics.averageEngagement * 100).toFixed(2) + "%" },
              { label: "Followers Gained", value: metrics.followersGained },
            ].map((item) => (
              <Box key={item.label} sx={{ flex: 1, p: 2, bgcolor: "#0f172a", borderRadius: 1 }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  {item.label}
                </Typography>
                <Typography variant="h6">{item.value}</Typography>
              </Box>
            ))}
          </Stack>

          <Box sx={{ p: 2, bgcolor: "#0f172a", borderRadius: 1, border: `2px solid ${tierColors[metrics.accountTier]}` }}>
            <Typography variant="body2" sx={{ mb: 1, color: tierColors[metrics.accountTier], fontWeight: 700 }}>
              Tier Badge: {metrics.accountTier.charAt(0).toUpperCase() + metrics.accountTier.slice(1)}
            </Typography>
            {metrics.accountTier === "starter" && (
              <Typography variant="caption">Reach 10K views to advance to Growth tier</Typography>
            )}
            {metrics.accountTier === "growth" && (
              <Typography variant="caption">Reach 100K views to advance to Professional tier</Typography>
            )}
            {metrics.accountTier === "professional" && (
              <Typography variant="caption">Reach 1M views to advance to Elite tier</Typography>
            )}
            {metrics.accountTier === "elite" && <Typography variant="caption">You're at the top tier!</Typography>}
          </Box>

          {guidance.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, color: "#f59e0b" }}>
                Guidance
              </Typography>
              <Stack spacing={1}>
                {guidance.map((tip, i) => (
                  <Alert key={i} severity="info" sx={{ mb: 0 }}>
                    {tip}
                  </Alert>
                ))}
              </Stack>
            </Box>
          )}
        </Paper>
      )}
    </Container>
  );
}
