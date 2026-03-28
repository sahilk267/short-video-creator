import React from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  FormControl,
  FormControlLabel,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  CaptionPositionEnum,
  MusicMoodEnum,
  MusicVolumeEnum,
  OrientationEnum,
  RenderConfig,
  TextModeEnum,
  VideoTypeEnum,
  VoiceEnum,
} from "../../../types/shorts";
import { supportedCreateLanguages } from "../../../config/languageSupport";

interface VideoConfigPanelProps {
  config: RenderConfig;
  onConfigChange: <K extends keyof RenderConfig>(field: K, value: RenderConfig[K]) => void;
}

const VideoConfigPanel: React.FC<VideoConfigPanelProps> = ({
  config,
  onConfigChange,
}) => {
  return (
    <>
      <Typography variant="h5" component="h2" gutterBottom>
        Video Configuration
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Start with the basics below. Advanced appearance controls are available in the expandable section.
        </Typography>

        <Grid container spacing={3} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Video Type</InputLabel>
              <Select
                value={config.videoType}
                onChange={(e) => onConfigChange("videoType", e.target.value as RenderConfig["videoType"])}
                label="Video Type"
                required
              >
                {Object.values(VideoTypeEnum).map((videoType) => (
                  <MenuItem key={videoType} value={videoType}>
                    {videoType === VideoTypeEnum.short ? "Short-form" : "Long-form"}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Orientation</InputLabel>
              <Select
                value={config.orientation}
                onChange={(e) => onConfigChange("orientation", e.target.value as OrientationEnum)}
                label="Orientation"
                required
              >
                {Object.values(OrientationEnum).map((orientation) => (
                  <MenuItem key={orientation} value={orientation}>
                    {orientation}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Target Duration Limit (sec)"
              value={config.durationLimit}
              onChange={(e) => onConfigChange("durationLimit", Math.max(15, parseInt(e.target.value || "0", 10) || 15))}
              InputProps={{
                endAdornment: <InputAdornment position="end">sec</InputAdornment>,
              }}
              helperText={config.videoType === VideoTypeEnum.long
                ? "Use 480-900 seconds for 8-15 minute videos."
                : "Short-form mode is capped lower automatically."}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="End Screen Padding (ms)"
              value={config.paddingBack}
              onChange={(e) => onConfigChange("paddingBack", parseInt(e.target.value, 10))}
              InputProps={{
                endAdornment: <InputAdornment position="end">ms</InputAdornment>,
              }}
              helperText="Duration to keep playing after narration ends"
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Music Mood</InputLabel>
              <Select
                value={config.music}
                onChange={(e) => onConfigChange("music", e.target.value as RenderConfig["music"])}
                label="Music Mood"
                required
              >
                {Object.values(MusicMoodEnum).map((tag) => (
                  <MenuItem key={tag} value={tag}>
                    {tag}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Default Voice</InputLabel>
              <Select
                value={config.voice}
                onChange={(e) => onConfigChange("voice", e.target.value as VoiceEnum)}
                label="Default Voice"
                required
              >
                {Object.values(VoiceEnum).map((voice) => (
                  <MenuItem key={voice} value={voice}>
                    {voice}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Accordion disableGutters elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                Advanced settings
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Caption styling, background audio volume, and AI image options.
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  Text Controls
                </Typography>
              </Grid>

              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Script Language</InputLabel>
                  <Select
                    value={config.scriptLanguage}
                    onChange={(e) => onConfigChange("scriptLanguage", e.target.value as RenderConfig["scriptLanguage"])}
                    label="Script Language"
                    required
                  >
                    {supportedCreateLanguages.map((language) => (
                      <MenuItem key={language.code} value={language.code}>
                        {language.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Audio Language</InputLabel>
                  <Select
                    value={config.audioLanguage}
                    onChange={(e) => onConfigChange("audioLanguage", e.target.value as RenderConfig["audioLanguage"])}
                    label="Audio Language"
                    required
                  >
                    {supportedCreateLanguages.map((language) => (
                      <MenuItem key={language.code} value={language.code}>
                        {language.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Overlay Language</InputLabel>
                  <Select
                    value={config.overlayLanguage}
                    onChange={(e) => onConfigChange("overlayLanguage", e.target.value as RenderConfig["overlayLanguage"])}
                    label="Overlay Language"
                    required
                  >
                    {supportedCreateLanguages.map((language) => (
                      <MenuItem key={language.code} value={language.code}>
                        {language.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Text Mode</InputLabel>
                  <Select
                    value={config.textMode}
                    onChange={(e) => onConfigChange("textMode", e.target.value as RenderConfig["textMode"])}
                    label="Text Mode"
                    required
                  >
                    <MenuItem value={TextModeEnum.overlay}>Overlay Only</MenuItem>
                    <MenuItem value={TextModeEnum.captions}>Captions Only</MenuItem>
                    <MenuItem value={TextModeEnum.hybrid}>Hybrid</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Caption Language</InputLabel>
                  <Select
                    value={config.captionLanguage}
                    onChange={(e) => onConfigChange("captionLanguage", e.target.value as RenderConfig["captionLanguage"])}
                    label="Caption Language"
                    required
                  >
                    {supportedCreateLanguages.map((language) => (
                      <MenuItem key={language.code} value={language.code}>
                        {language.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Caption Position</InputLabel>
                  <Select
                    value={config.captionPosition}
                    onChange={(e) => onConfigChange("captionPosition", e.target.value as RenderConfig["captionPosition"])}
                    label="Caption Position"
                    required
                  >
                    {Object.values(CaptionPositionEnum).map((position) => (
                      <MenuItem key={position} value={position}>
                        {position}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Caption Background Color"
                  value={config.captionBackgroundColor}
                  onChange={(e) => onConfigChange("captionBackgroundColor", e.target.value)}
                  helperText="Any valid CSS color (name, hex, rgba)"
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Subtitle Lines"
                  value={config.subtitleLineCount}
                  onChange={(e) => onConfigChange("subtitleLineCount", Math.min(3, Math.max(1, parseInt(e.target.value || "1", 10) || 1)))}
                  helperText="How many subtitle lines can appear at once."
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Subtitle Size Scale"
                  value={config.subtitleFontScale}
                  onChange={(e) => onConfigChange("subtitleFontScale", Math.min(1.4, Math.max(0.8, Number(e.target.value || "1"))))}
                  inputProps={{ step: 0.05, min: 0.8, max: 1.4 }}
                  helperText="1.0 is the current default. Increase for stronger subtitles."
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  Audio Controls
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Volume of the background audio</InputLabel>
                  <Select
                    value={config.musicVolume}
                    onChange={(e) => onConfigChange("musicVolume", e.target.value as MusicVolumeEnum)}
                    label="Volume of the background audio"
                    required
                  >
                    {Object.values(MusicVolumeEnum).map((volume) => (
                      <MenuItem key={volume} value={volume}>
                        {volume}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  value={config.voice}
                  label="Narration Voice"
                  helperText="This voice now drives render narration, not just preview labels."
                  InputProps={{ readOnly: true }}
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: "rgba(0,0,0,0.05)", borderRadius: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.useAiImages || false}
                        onChange={(e) => onConfigChange("useAiImages", e.target.checked)}
                        color="primary"
                      />
                    }
                    label={(
                      <Box display="flex" alignItems="center">
                        <AutoFixHighIcon sx={{ mr: 1, color: "primary.main" }} />
                        <Typography variant="body1" fontWeight="bold">
                          Use AI Generated Images (Pollinations.ai)
                        </Typography>
                      </Box>
                    )}
                  />
                  <Typography variant="caption" display="block" sx={{ ml: 7 }}>
                    Replaces stock videos with highly accurate AI-generated images matching your text.
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Paper>
    </>
  );
};

export default VideoConfigPanel;
