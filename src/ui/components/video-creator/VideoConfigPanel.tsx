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
  VoiceEnum,
} from "../../../types/shorts";

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
