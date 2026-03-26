import React, { useState } from "react";
import {
  Box,
  Grid,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import BuildIcon from "@mui/icons-material/Build";
import IdeationPanel from "../components/content/IdeationPanel";
import EditingRecommendations from "../components/content/EditingRecommendations";
import ModerationChecker from "../components/content/ModerationChecker";
import AccessibilityChecker from "../components/content/AccessibilityChecker";
import ThumbnailGenerator from "../components/content/ThumbnailGenerator";
import ScriptImprover from "../components/content/ScriptImprover";
import type { IdeaItem } from "../hooks/useContentSuggestions";

type TabId = "ideation" | "editing" | "moderation" | "accessibility" | "thumbnail" | "script";

const TABS: { id: TabId; label: string }[] = [
  { id: "ideation", label: "Ideation" },
  { id: "editing", label: "Editing" },
  { id: "moderation", label: "Moderation" },
  { id: "accessibility", label: "Accessibility" },
  { id: "thumbnail", label: "Thumbnail Tags" },
  { id: "script", label: "Script Improver" },
];

const ContentTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>("ideation");
  const [selectedScript, setSelectedScript] = useState("");
  const [selectedTitle, setSelectedTitle] = useState("");

  const handleSelectIdea = (idea: IdeaItem) => {
    setSelectedTitle(idea.title);
    if (idea.description) setSelectedScript(idea.description);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <BuildIcon color="primary" fontSize="large" />
        <Box>
          <Typography variant="h4" fontWeight={700}>Content Tools</Typography>
          <Typography variant="body2" color="text.secondary">
            AI-powered ideation, editing, moderation, accessibility, and script enhancement
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
        {TABS.map((t) => (
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
              <strong>Script:</strong> {selectedScript.slice(0, 120)}{selectedScript.length > 120 ? "…" : ""}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ContentTools;
