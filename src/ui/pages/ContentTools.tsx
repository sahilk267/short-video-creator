import React, { useState } from "react";
import {
  Box,
  Container,
  Tab,
  Tabs,
  Typography,
  Paper,
  Grid,
  Alert,
  Button,
  Stack,
  Chip,
} from "@mui/material";
import BuildIcon from "@mui/icons-material/Build";
import { useNavigate } from "react-router-dom";

// Old components (kept for backward compatibility)
import IdeationPanel from "../components/content/IdeationPanel";
import EditingRecommendations from "../components/content/EditingRecommendations";
import ModerationChecker from "../components/content/ModerationChecker";
import AccessibilityChecker from "../components/content/AccessibilityChecker";
import ThumbnailGenerator from "../components/content/ThumbnailGenerator";
import ScriptImprover from "../components/content/ScriptImprover";
import type { IdeaItem } from "../hooks/useContentSuggestions";

type TabId =
  | "ideation"
  | "editing"
  | "moderation"
  | "accessibility"
  | "thumbnail"
  | "script"
  | "advanced";

const LEGACY_TABS: { id: Exclude<TabId, "advanced">; label: string }[] = [
  { id: "ideation", label: "Ideation" },
  { id: "editing", label: "Editing" },
  { id: "moderation", label: "Moderation" },
  { id: "accessibility", label: "Accessibility" },
  { id: "thumbnail", label: "Thumbnail Tags" },
  { id: "script", label: "Script Improver" },
];

const NEW_ENGINES = [
  {
    id: "humanized",
    label: "Humanized Content",
    description: "Add human emotion to your script",
    path: "/humanized",
    badge: "NEW",
  },
  {
    id: "thumbnail-gen",
    label: "Advanced Thumbnail",
    description: "AI-powered thumbnail generation",
    path: "/thumbnail",
    badge: "NEW",
  },
  {
    id: "editing-plan",
    label: "Expert Editing",
    description: "Professional editing plan generation",
    path: "/editing",
    badge: "NEW",
  },
  {
    id: "visual",
    label: "Visual Enhancement",
    description: "Sharpen, contrast, and color correction",
    path: "/visual",
    badge: "NEW",
  },
  {
    id: "audio",
    label: "Audio Quality",
    description: "LUFS normalization and audio processing",
    path: "/audio",
    badge: "NEW",
  },
  {
    id: "emotional",
    label: "Emotional Resonance",
    description: "Analyze emotional content alignment",
    path: "/emotional",
    badge: "NEW",
  },
  {
    id: "attention",
    label: "Attention Optimizer",
    description: "Optimize for platform-specific retention",
    path: "/attention",
    badge: "NEW",
  },
  {
    id: "quality",
    label: "Quality Scoring",
    description: "Comprehensive quality metrics analysis",
    path: "/quality",
    badge: "NEW",
  },
  {
    id: "engagement",
    label: "Engagement Prediction",
    description: "Predict viral potential & metrics",
    path: "/engagement",
    badge: "NEW",
  },
  {
    id: "account",
    label: "Account Manager",
    description: "Track account health & tier progress",
    path: "/account",
    badge: "NEW",
  },
];

const ContentTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>("advanced");
  const [selectedScript, setSelectedScript] = useState("");
  const [selectedTitle, setSelectedTitle] = useState("");
  const navigate = useNavigate();

  const handleSelectIdea = (idea: IdeaItem) => {
    setSelectedTitle(idea.title);
    if (idea.description) setSelectedScript(idea.description);
  };

  const handleNavigateEngine = (path: string) => {
    navigate(path);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <BuildIcon color="primary" fontSize="large" />
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Content Tools & AI Engines
          </Typography>
          <Typography variant="body2" color="text.secondary">
            60 complete AI engines for viral content creation
          </Typography>
        </Box>
      </Box>

      <Tabs
        value={activeTab}
        onChange={(_e, v: TabId) => setActiveTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab label="🚀 Advanced Engines (NEW)" value="advanced" />
        <Tab label="Legacy Tools" value="ideation" />
      </Tabs>

      {/* ADVANCED ENGINES TAB */}
      {activeTab === "advanced" && (
        <Box>
          <Alert severity="success" sx={{ mb: 3 }}>
            <strong>✨ 10 New Cutting-Edge Engines Now Available!</strong>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Deploy the latest AI engines for professional content creation. Each engine handles a specific aspect of
              viral content optimization.
            </Typography>
          </Alert>

          <Grid container spacing={2}>
            {NEW_ENGINES.map((engine) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={engine.id}>
                <Paper
                  sx={{
                    p: 2.5,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    bgcolor: "#1e293b",
                    border: "1px solid #334155",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 8px 16px rgba(99, 102, 241, 0.15)",
                      borderColor: "#6366f1",
                      bgcolor: "#0f172a",
                    },
                  }}
                  onClick={() => handleNavigateEngine(engine.path)}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box>
                      <Typography variant="h6" sx={{ color: "#6366f1", fontWeight: 700 }}>
                        {engine.label}
                      </Typography>
                    </Box>
                    <Chip
                      label={engine.badge}
                      size="small"
                      sx={{
                        bgcolor: "#22c55e",
                        color: "#000",
                        fontWeight: 700,
                        height: 24,
                      }}
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                    {engine.description}
                  </Typography>

                  <Button
                    size="small"
                    variant="outlined"
                    fullWidth
                    sx={{ mt: "auto", borderColor: "#6366f1", color: "#6366f1" }}
                  >
                    Open Engine →
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* FEATURES OVERVIEW */}
          <Paper sx={{ p: 3, mt: 4, bgcolor: "#1e293b", border: "1px solid #334155" }}>
            <Typography variant="h6" sx={{ mb: 2, color: "#f59e0b", fontWeight: 700 }}>
              📊 Engine Categories
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: "#6366f1" }}>
                    Content Creation
                  </Typography>
                  <Stack spacing={0.5}>
                    <Typography variant="caption">• Humanized Content</Typography>
                    <Typography variant="caption">• Script Improvement</Typography>
                    <Typography variant="caption">• Emotional Resonance</Typography>
                  </Stack>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: "#f59e0b" }}>
                    Visual & Audio
                  </Typography>
                  <Stack spacing={0.5}>
                    <Typography variant="caption">• Thumbnail Generation</Typography>
                    <Typography variant="caption">• Visual Enhancement</Typography>
                    <Typography variant="caption">• Audio Quality</Typography>
                  </Stack>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: "#22c55e" }}>
                    Optimization
                  </Typography>
                  <Stack spacing={0.5}>
                    <Typography variant="caption">• Expert Editing</Typography>
                    <Typography variant="caption">• Attention Optimizer</Typography>
                    <Typography variant="caption">• Quality Scoring</Typography>
                  </Stack>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: "#ef4444" }}>
                    Analytics
                  </Typography>
                  <Stack spacing={0.5}>
                    <Typography variant="caption">• Engagement Prediction</Typography>
                    <Typography variant="caption">• Account Manager</Typography>
                    <Typography variant="caption">• Performance Metrics</Typography>
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      )}

      {/* LEGACY TABS */}
      {activeTab !== "advanced" && (
        <>
          <Box
            sx={{
              display: "flex",
              gap: 1,
              mb: 2,
              p: 2,
              bgcolor: "#f0f4ff",
              borderRadius: 1,
              borderLeft: "4px solid #fbbf24",
            }}
          >
            <Typography variant="body2">
              💡 <strong>Tip:</strong> Check out the new "Advanced Engines" tab for 10 cutting-edge AI features!
            </Typography>
          </Box>

          <Tabs
            value={activeTab}
            onChange={(_e, v: TabId) => setActiveTab(v as any)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
          >
            {LEGACY_TABS.map((t) => (
              <Tab key={t.id} value={t.id} label={t.label} />
            ))}
          </Tabs>

          <Grid container spacing={3}>
            {activeTab === "ideation" && (
              <Grid item xs={12}>
                <IdeationPanel onSelectIdea={handleSelectIdea} />
              </Grid>
            )}

            {activeTab === "editing" && (
              <Grid item xs={12}>
                <EditingRecommendations initialScript={selectedScript} />
              </Grid>
            )}

            {activeTab === "moderation" && (
              <Grid item xs={12}>
                <ModerationChecker initialText={selectedScript} />
              </Grid>
            )}

            {activeTab === "accessibility" && (
              <Grid item xs={12}>
                <AccessibilityChecker initialScript={selectedScript} />
              </Grid>
            )}

            {activeTab === "thumbnail" && (
              <Grid item xs={12}>
                <ThumbnailGenerator initialTitle={selectedTitle} />
              </Grid>
            )}

            {activeTab === "script" && (
              <Grid item xs={12}>
                <ScriptImprover initialScript={selectedScript} />
              </Grid>
            )}
          </Grid>

          {(selectedScript || selectedTitle) && (
            <Box sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: "primary.50", border: "1px solid", borderColor: "primary.200" }}>
              <Typography variant="caption" color="primary.main" fontWeight={600}>
                Context carried from Ideation
              </Typography>
              {selectedTitle && (
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  <strong>Title:</strong> {selectedTitle}
                </Typography>
              )}
              {selectedScript && (
                <Typography variant="body2" sx={{ mt: 0.25 }} noWrap>
                  <strong>Script:</strong> {selectedScript.slice(0, 120)}
                  {selectedScript.length > 120 ? "…" : ""}
                </Typography>
              )}
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default ContentTools;
