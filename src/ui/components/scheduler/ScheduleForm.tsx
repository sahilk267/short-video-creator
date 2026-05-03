/**
 * ScheduleForm – form to enqueue a new render job
 * Updated: Added platforms, 30 languages, engine toggles, quality settings
 */

import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Grid,
  Stack,
  Typography,
  Divider,
  Alert,
  CircularProgress,
  Collapse,
  IconButton,
  Tooltip,
  FormControlLabel,
  Switch,
  Chip,
  Slider,
  OutlinedInput,
  InputLabel,
  FormControl,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import SendIcon from "@mui/icons-material/Send";
import TuneIcon from "@mui/icons-material/Tune";
import { CronBuilder } from "./CronBuilder";
import { useEnqueueJob, type EnqueueJobRequest } from "../../hooks/useSchedulerMutation";

const ORIENTATIONS = ["portrait", "landscape"] as const;
const VIDEO_TYPES = ["short", "long"] as const;

const PLATFORMS = [
  { value: "youtube", label: "YouTube" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "twitter", label: "X / Twitter" },
  { value: "facebook", label: "Facebook" },
  { value: "telegram", label: "Telegram" },
];

const LANGUAGES = [
  { value: "en", label: "🇺🇸 English" },
  { value: "hi", label: "🇮🇳 Hindi" },
  { value: "ur", label: "🇵🇰 Urdu" },
  { value: "ar", label: "🇸🇦 Arabic" },
  { value: "es", label: "🇪🇸 Spanish" },
  { value: "fr", label: "🇫🇷 French" },
  { value: "de", label: "🇩🇪 German" },
  { value: "pt", label: "🇧🇷 Portuguese" },
  { value: "ja", label: "🇯🇵 Japanese" },
  { value: "zh", label: "🇨🇳 Chinese" },
  { value: "ko", label: "🇰🇷 Korean" },
  { value: "bn", label: "🇧🇩 Bengali" },
  { value: "it", label: "🇮🇹 Italian" },
  { value: "nl", label: "🇳🇱 Dutch" },
  { value: "sv", label: "🇸🇪 Swedish" },
  { value: "no", label: "🇳🇴 Norwegian" },
  { value: "da", label: "🇩🇰 Danish" },
  { value: "pl", label: "🇵🇱 Polish" },
  { value: "ru", label: "🇷🇺 Russian" },
  { value: "tr", label: "🇹🇷 Turkish" },
  { value: "vi", label: "🇻🇳 Vietnamese" },
  { value: "th", label: "🇹🇭 Thai" },
  { value: "id", label: "🇮🇩 Indonesian" },
  { value: "fil", label: "🇵🇭 Filipino" },
  { value: "el", label: "🇬🇷 Greek" },
  { value: "he", label: "🇮🇱 Hebrew" },
  { value: "ro", label: "🇷🇴 Romanian" },
  { value: "hu", label: "🇭🇺 Hungarian" },
  { value: "cs", label: "🇨🇿 Czech" },
  { value: "sk", label: "🇸🇰 Slovak" },
];

const CATEGORIES = [
  "World", "Technology", "Science", "Business", "Sports",
  "Entertainment", "Health", "Politics", "Finance", "Culture",
  "Education", "Lifestyle", "Travel", "Food", "Fashion",
];

const QUALITY_TIERS = [
  { value: "draft", label: "Draft (Fast)" },
  { value: "standard", label: "Standard (Balanced)" },
  { value: "premium", label: "Premium (Best Quality)" },
];

interface EngineToggles {
  enableTranslation: boolean;
  enableCommentCTA: boolean;
  enablePlatformPsych: boolean;
  enableSeries: boolean;
  enableHumanMimicry: boolean;
  enableHashtagOptimization: boolean;
  enableEngagementOptimization: boolean;
}

interface QualitySettings {
  targetLUFS: number;
  sharpnessLevel: number;
  visualQualityTier: "draft" | "standard" | "premium";
}

const DEFAULT_ENGINES: EngineToggles = {
  enableTranslation: false,
  enableCommentCTA: true,
  enablePlatformPsych: true,
  enableSeries: false,
  enableHumanMimicry: true,
  enableHashtagOptimization: true,
  enableEngagementOptimization: true,
};

const DEFAULT_QUALITY: QualitySettings = {
  targetLUFS: -14,
  sharpnessLevel: 1.5,
  visualQualityTier: "standard",
};

const DEFAULT_FORM: EnqueueJobRequest = {
  category: "Technology",
  orientation: "portrait",
  videoType: "short",
  subtitleLanguage: "en",
  sceneText: "",
  subcategory: "",
  keywords: "",
  searchTerms: "",
};

interface ScheduleFormProps {
  onSuccess?: () => void;
}

export const ScheduleForm: React.FC<ScheduleFormProps> = ({ onSuccess }) => {
  const [form, setForm] = useState<EnqueueJobRequest>(DEFAULT_FORM);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["youtube", "instagram"]);
  const [cronExpr, setCronExpr] = useState("0 * * * *");
  const [showCron, setShowCron] = useState(false);
  const [showEngines, setShowEngines] = useState(false);
  const [showQuality, setShowQuality] = useState(false);
  const [engines, setEngines] = useState<EngineToggles>(DEFAULT_ENGINES);
  const [quality, setQuality] = useState<QualitySettings>(DEFAULT_QUALITY);
  const { enqueue, loading, error, data } = useEnqueueJob();

  const handleChange = (field: keyof EnqueueJobRequest) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handlePlatformsChange = (e: SelectChangeEvent<string[]>) => {
    const val = e.target.value;
    setSelectedPlatforms(typeof val === "string" ? val.split(",") : val);
  };

  const handleEngineToggle = (key: keyof EngineToggles) => {
    setEngines((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const enrichedForm = {
      ...form,
      platforms: selectedPlatforms,
      engineConfig: engines,
      qualitySettings: quality,
    } as any;
    const result = await enqueue(enrichedForm);
    if (result) {
      setForm(DEFAULT_FORM);
      setSelectedPlatforms(["youtube", "instagram"]);
      setEngines(DEFAULT_ENGINES);
      setQuality(DEFAULT_QUALITY);
      onSuccess?.();
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        New Render Job
      </Typography>

      {/* ─── Core Fields ─────────────────────────────────────────────── */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth select size="small" label="Category"
            value={form.category} onChange={handleChange("category")} required
          >
            {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth select size="small" label="Orientation"
            value={form.orientation} onChange={handleChange("orientation")}
          >
            {ORIENTATIONS.map((o) => (
              <MenuItem key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth select size="small" label="Video Type"
            value={form.videoType} onChange={handleChange("videoType")}
          >
            {VIDEO_TYPES.map((t) => (
              <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* ── Subtitle Language (expanded to 30) ── */}
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth select size="small" label="Subtitle Language"
            value={form.subtitleLanguage} onChange={handleChange("subtitleLanguage")}
          >
            {LANGUAGES.map((l) => (
              <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* ── Platform Multi-select ── */}
        <Grid item xs={12} sm={8}>
          <FormControl fullWidth size="small">
            <InputLabel>Publish to Platforms</InputLabel>
            <Select
              multiple
              value={selectedPlatforms}
              onChange={handlePlatformsChange}
              input={<OutlinedInput label="Publish to Platforms" />}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {(selected as string[]).map((v) => (
                    <Chip
                      key={v}
                      label={PLATFORMS.find((p) => p.value === v)?.label ?? v}
                      size="small"
                      sx={{ height: 20, fontSize: "0.7rem" }}
                    />
                  ))}
                </Box>
              )}
            >
              {PLATFORMS.map((p) => (
                <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth size="small" label="Subcategory"
            value={form.subcategory} onChange={handleChange("subcategory")}
            placeholder="e.g. Geopolitics"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth size="small" label="Keywords (comma-separated)"
            value={form.keywords} onChange={handleChange("keywords")}
            placeholder="e.g. defense, diplomacy, sanctions"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth size="small" label="Search terms (comma-separated)"
            value={form.searchTerms} onChange={handleChange("searchTerms")}
            placeholder="e.g. AI, machine learning, neural networks"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth size="small" label="Scene description (optional)"
            value={form.sceneText} onChange={handleChange("sceneText")}
            placeholder="Describe the video content..."
            multiline minRows={2}
          />
        </Grid>
      </Grid>

      {/* ─── Engine Configuration ─────────────────────────────────────── */}
      <Divider sx={{ my: 2 }} />
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <TuneIcon fontSize="small" sx={{ color: "primary.main" }} />
        <Typography variant="subtitle2" fontWeight={600}>AI Engine Configuration</Typography>
        <Chip label={`${Object.values(engines).filter(Boolean).length}/${Object.keys(engines).length} ON`} size="small" color="primary" variant="outlined" />
        <IconButton size="small" onClick={() => setShowEngines((v) => !v)}>
          {showEngines ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Stack>
      <Collapse in={showEngines}>
        <Box sx={{ p: 2, bgcolor: "background.paper", borderRadius: 2, mb: 2, border: "1px solid", borderColor: "divider" }}>
          <Grid container spacing={1}>
            {[
              { key: "enableTranslation" as const, label: "Translation Engine", desc: "Auto-translate subtitles & captions" },
              { key: "enableCommentCTA" as const, label: "Comment CTA", desc: "AI-generated call-to-actions" },
              { key: "enablePlatformPsych" as const, label: "Platform Psychology", desc: "Optimize for platform behavior" },
              { key: "enableSeries" as const, label: "Series Builder", desc: "Auto-create multi-part series" },
              { key: "enableHumanMimicry" as const, label: "Human Mimicry", desc: "Natural posting patterns" },
              { key: "enableHashtagOptimization" as const, label: "Hashtag Optimizer", desc: "AI hashtag selection" },
              { key: "enableEngagementOptimization" as const, label: "Engagement Optimizer", desc: "Maximize retention & engagement" },
            ].map(({ key, label, desc }) => (
              <Grid item xs={12} sm={6} key={key}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 1, borderRadius: 1, bgcolor: engines[key] ? "rgba(99,102,241,0.08)" : "transparent" }}>
                  <Box>
                    <Typography variant="body2" fontWeight={engines[key] ? 600 : 400}>{label}</Typography>
                    <Typography variant="caption" color="text.secondary">{desc}</Typography>
                  </Box>
                  <Switch
                    size="small"
                    checked={engines[key]}
                    onChange={() => handleEngineToggle(key)}
                    color="primary"
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Collapse>

      {/* ─── Quality Settings ─────────────────────────────────────────── */}
      <Divider sx={{ my: 2 }} />
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Typography variant="subtitle2" fontWeight={600} color="text.secondary">Quality Settings</Typography>
        <Chip label={quality.visualQualityTier} size="small" color="secondary" variant="outlined" />
        <IconButton size="small" onClick={() => setShowQuality((v) => !v)}>
          {showQuality ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Stack>
      <Collapse in={showQuality}>
        <Box sx={{ p: 2, bgcolor: "background.paper", borderRadius: 2, mb: 2, border: "1px solid", borderColor: "divider" }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth select size="small" label="Visual Quality Tier"
                value={quality.visualQualityTier}
                onChange={(e) => setQuality((q) => ({ ...q, visualQualityTier: e.target.value as any }))}
              >
                {QUALITY_TIERS.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                Target Audio LUFS: <strong>{quality.targetLUFS} LUFS</strong>
              </Typography>
              <Slider
                value={quality.targetLUFS}
                onChange={(_, v) => setQuality((q) => ({ ...q, targetLUFS: v as number }))}
                min={-24} max={-6} step={1} size="small"
                marks={[{ value: -14, label: "-14" }, { value: -16, label: "-16" }]}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                Sharpness Level: <strong>{quality.sharpnessLevel}</strong>
              </Typography>
              <Slider
                value={quality.sharpnessLevel}
                onChange={(_, v) => setQuality((q) => ({ ...q, sharpnessLevel: v as number }))}
                min={0} max={5} step={0.5} size="small"
                marks={[{ value: 0, label: "Off" }, { value: 2.5, label: "Med" }, { value: 5, label: "Max" }]}
              />
            </Grid>
          </Grid>
        </Box>
      </Collapse>

      {/* ─── Recurrence Schedule ─────────────────────────────────────── */}
      <Divider sx={{ my: 2 }} />
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Recurrence Schedule (for reference)
        </Typography>
        <Tooltip title="Shows how often the backend scheduler runs. This value is set in server config.">
          <IconButton size="small" onClick={() => setShowCron((v) => !v)}>
            {showCron ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Stack>
      <Collapse in={showCron}>
        <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1, mb: 2 }}>
          <CronBuilder value={cronExpr} onChange={setCronExpr} />
        </Box>
      </Collapse>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {data && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Job enqueued! ID: <strong>{data.renderJobId}</strong>
        </Alert>
      )}

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack direction="row" spacing={1}>
          {selectedPlatforms.slice(0, 3).map((p) => (
            <Chip key={p} label={p} size="small" variant="outlined" sx={{ fontSize: "0.65rem" }} />
          ))}
          {selectedPlatforms.length > 3 && (
            <Chip label={`+${selectedPlatforms.length - 3}`} size="small" />
          )}
        </Stack>
        <Button
          type="submit"
          variant="contained"
          disabled={loading || !form.category || selectedPlatforms.length === 0}
          startIcon={loading ? <CircularProgress size={16} /> : <SendIcon />}
          size="small"
        >
          {loading ? "Enqueueing…" : "Enqueue Job"}
        </Button>
      </Stack>
    </Box>
  );
};

export default ScheduleForm;
