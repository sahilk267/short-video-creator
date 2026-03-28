import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import AddIcon from "@mui/icons-material/Add";
import Modal from "../shared/Modal";
import type { HookOption } from "../../../script-generator/AiLlmGenerator";

export interface NewsSourceOption {
  id: string;
  name: string;
  category: string;
  subCategory?: string;
  custom?: boolean;
}

export type AutoScriptStyle = "News" | "Viral" | "Explainer";

interface CustomSourceForm {
  name: string;
  url: string;
  subCategory: string;
}

interface AutoScriptPanelProps {
  autoLoading: boolean;
  topicsLoading: boolean;
  hooksLoading: boolean;
  sourceSaving: boolean;
  selectedCategory: string;
  selectedSources: string[];
  selectedTopic: string;
  selectedStyle: AutoScriptStyle;
  selectedHook: string;
  keywordQuery: string;
  sources: NewsSourceOption[];
  trendingTopics: string[];
  hookOptions: HookOption[];
  onCategoryChange: (category: string) => void;
  onSourceChange: (sourceIds: string[]) => void;
  onTopicChange: (topic: string) => void;
  onStyleChange: (style: AutoScriptStyle) => void;
  onHookChange: (hook: string) => void;
  onKeywordChange: (keywords: string) => void;
  onAutoRefresh: () => void;
  onGenerate: () => void;
  onCreateSource: (payload: { name: string; url: string; category: string; subCategory?: string }) => Promise<void>;
}

const ALL_SOURCES_VALUE = "__all_sources__";

const categoryOptions = [
  { id: "General", label: "General" },
  { id: "World", label: "World" },
  { id: "Technology", label: "Tech" },
  { id: "Business", label: "Business" },
  { id: "Cricket", label: "Cricket" },
  { id: "NBA", label: "NBA" },
  { id: "Sports", label: "Sports" },
  { id: "Science", label: "Science" },
];

const styleOptions: AutoScriptStyle[] = ["News", "Viral", "Explainer"];

const AutoScriptPanel: React.FC<AutoScriptPanelProps> = ({
  autoLoading,
  topicsLoading,
  hooksLoading,
  sourceSaving,
  selectedCategory,
  selectedSources,
  selectedTopic,
  selectedStyle,
  selectedHook,
  keywordQuery,
  sources,
  trendingTopics,
  hookOptions,
  onCategoryChange,
  onSourceChange,
  onTopicChange,
  onStyleChange,
  onHookChange,
  onKeywordChange,
  onAutoRefresh,
  onGenerate,
  onCreateSource,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customSourceForm, setCustomSourceForm] = useState<CustomSourceForm>({
    name: "",
    url: "",
    subCategory: "",
  });

  const filteredSources = useMemo(
    () => sources.filter((source) => source.category === selectedCategory),
    [sources, selectedCategory],
  );

  const allSelected = filteredSources.length > 0
    && filteredSources.every((source) => selectedSources.includes(source.id));

  const selectedSourceLabels = allSelected
    ? ["All Sources"]
    : filteredSources
      .filter((source) => selectedSources.includes(source.id))
      .map((source) => source.name);

  const handleSourceSelection = (value: string[]) => {
    const includesAll = value.includes(ALL_SOURCES_VALUE);
    if (includesAll) {
      onSourceChange(allSelected ? [] : filteredSources.map((source) => source.id));
      return;
    }

    onSourceChange(value);
  };

  const submitCustomSource = async () => {
    await onCreateSource({
      name: customSourceForm.name,
      url: customSourceForm.url,
      category: selectedCategory,
      subCategory: customSourceForm.subCategory || undefined,
    });
    setCustomSourceForm({ name: "", url: "", subCategory: "" });
    setIsModalOpen(false);
  };

  return (
    <Paper sx={{ p: 4, mb: 4, bgcolor: "rgba(25, 118, 210, 0.04)", border: "1px dashed #1976d2" }}>
      <Typography variant="h6" sx={{ display: "flex", alignItems: "center", mb: 2, color: "#1976d2" }}>
        <AutoFixHighIcon sx={{ mr: 1 }} /> Magic Auto-Scripting (with Ollama)
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, opacity: 0.8 }}>
        Pick category, multiple sources, keyword bias, trending angle, style, and hook. This will improve source coverage and keep the script focused on your target subject.
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>Category</Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
          {categoryOptions.map((cat) => (
            <Chip
              key={cat.id}
              label={cat.label}
              clickable
              color={selectedCategory === cat.id ? "primary" : "default"}
              variant={selectedCategory === cat.id ? "filled" : "outlined"}
              onClick={() => onCategoryChange(cat.id)}
            />
          ))}
        </Stack>
      </Box>

      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <FormControl fullWidth>
            <InputLabel id="news-source-label">Select News Sources</InputLabel>
            <Select
              multiple
              labelId="news-source-label"
              value={allSelected ? [ALL_SOURCES_VALUE] : selectedSources}
              label="Select News Sources"
              renderValue={() => selectedSourceLabels.join(", ")}
              onChange={(e) => handleSourceSelection(typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value)}
            >
              <MenuItem value={ALL_SOURCES_VALUE}>All Sources</MenuItem>
              {filteredSources.map((source) => (
                <MenuItem key={source.id} value={source.id}>
                  {source.name} {source.subCategory ? `(${source.subCategory})` : ""} {source.custom ? "[Custom]" : ""}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={2}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setIsModalOpen(true)}
            sx={{ height: "56px" }}
          >
            Add Source
          </Button>
        </Grid>
        <Grid item xs={12} md={2}>
          <Button
            fullWidth
            variant="outlined"
            onClick={onAutoRefresh}
            disabled={selectedSources.length === 0 || topicsLoading || hooksLoading || autoLoading}
            startIcon={(topicsLoading || hooksLoading) ? <CircularProgress size={20} color="inherit" /> : <AutoFixHighIcon />}
            sx={{ height: "56px" }}
          >
            {(topicsLoading || hooksLoading) ? "Refreshing..." : "Auto"}
          </Button>
        </Grid>
      </Grid>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Keywords (Optional)"
          value={keywordQuery}
          onChange={(e) => onKeywordChange(e.target.value)}
          placeholder="e.g. EV battery, Nvidia chips, Gaza ceasefire"
          helperText="Use comma-separated keywords to keep topic discovery and script generation focused on specific angles."
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
          Trending Topics
        </Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1, minHeight: 40 }}>
          {trendingTopics.map((topic) => (
            <Chip
              key={topic}
              label={topic}
              clickable
              color={selectedTopic === topic ? "primary" : "default"}
              variant={selectedTopic === topic ? "filled" : "outlined"}
              onClick={() => onTopicChange(topic)}
            />
          ))}
          {!trendingTopics.length && (
            <Typography variant="body2" color="text.secondary">
              {topicsLoading ? "Loading topics..." : "Pick one or more sources, then use Auto to fetch topic angles."}
            </Typography>
          )}
        </Stack>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
          Style
        </Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
          {styleOptions.map((style) => (
            <Chip
              key={style}
              label={style}
              clickable
              color={selectedStyle === style ? "primary" : "default"}
              variant={selectedStyle === style ? "filled" : "outlined"}
              onClick={() => onStyleChange(style)}
            />
          ))}
        </Stack>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
          Hook
        </Typography>
        <RadioGroup value={selectedHook} onChange={(e) => onHookChange(e.target.value)}>
          {hookOptions.map((hook) => (
            <FormControlLabel
              key={hook.text}
              value={hook.text}
              control={<Radio />}
              label={(
                <Box>
                  <Typography variant="body1">{hook.text}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {hook.scoreLabel} ({hook.score}/100) • {hook.rationale}
                  </Typography>
                </Box>
              )}
            />
          ))}
        </RadioGroup>
        {!hookOptions.length && (
          <Typography variant="body2" color="text.secondary">
            {hooksLoading ? "Loading hooks..." : "Select a topic to generate hook options."}
          </Typography>
        )}
      </Box>

      <Button
        fullWidth
        variant="contained"
        size="large"
        onClick={onGenerate}
        disabled={autoLoading || selectedSources.length === 0}
        startIcon={autoLoading ? <CircularProgress size={20} color="inherit" /> : <AutoFixHighIcon />}
        sx={{ height: "56px" }}
      >
        {autoLoading ? "Generating..." : "Generate Script"}
      </Button>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Custom RSS Source"
        actions={(
          <>
            <Button onClick={() => setIsModalOpen(false)} disabled={sourceSaving}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => void submitCustomSource()}
              disabled={sourceSaving || !customSourceForm.name.trim() || !customSourceForm.url.trim()}
            >
              {sourceSaving ? "Saving..." : "Save Source"}
            </Button>
          </>
        )}
      >
        <Stack spacing={2} sx={{ pt: 1, minWidth: { xs: 260, sm: 420 } }}>
          <Typography variant="body2" color="text.secondary">
            Add RSS/feed URLs here. X handles should be added later through a dedicated API integration, not as plain handles.
          </Typography>
          <TextField
            fullWidth
            label="Source Name"
            value={customSourceForm.name}
            onChange={(e) => setCustomSourceForm((current) => ({ ...current, name: e.target.value }))}
          />
          <TextField
            fullWidth
            label="Feed URL"
            placeholder="https://example.com/rss.xml"
            value={customSourceForm.url}
            onChange={(e) => setCustomSourceForm((current) => ({ ...current, url: e.target.value }))}
          />
          <TextField
            fullWidth
            label="Subcategory (Optional)"
            value={customSourceForm.subCategory}
            onChange={(e) => setCustomSourceForm((current) => ({ ...current, subCategory: e.target.value }))}
          />
          <TextField fullWidth label="Category" value={selectedCategory} disabled />
        </Stack>
      </Modal>
    </Paper>
  );
};

export default AutoScriptPanel;
