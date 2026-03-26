import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { usePersonalizeMutation } from "../../hooks/useContentSuggestions";

const AUDIENCES = ["general", "teens", "professionals", "kids", "seniors", "gamers", "sports-fans"];
const TONES = ["casual", "formal", "humorous", "inspiring", "educational", "dramatic"];

interface ScriptImproverProps {
  initialScript?: string;
}

const ScriptImprover: React.FC<ScriptImproverProps> = ({ initialScript = "" }) => {
  const [script, setScript] = useState(initialScript);
  const [audience, setAudience] = useState("general");
  const [tone, setTone] = useState("casual");
  const [copied, setCopied] = useState(false);

  const mutation = usePersonalizeMutation();

  const handleImprove = () => {
    if (script.trim()) {
      mutation.mutate({ script, audience, preferences: { tone } });
    }
  };

  const improved = mutation.data?.script;

  const handleCopy = () => {
    if (improved) {
      void navigator.clipboard.writeText(improved);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <AutoFixHighIcon color="primary" />
          <Typography variant="h6">Script Improver</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Personalise and enhance your script for a specific target audience and tone.
        </Typography>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Target Audience</InputLabel>
              <Select value={audience} label="Target Audience" onChange={(e) => setAudience(e.target.value)}>
                {AUDIENCES.map((a) => (
                  <MenuItem key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1).replace("-", " ")}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Tone</InputLabel>
              <Select value={tone} label="Tone" onChange={(e) => setTone(e.target.value)}>
                {TONES.map((t) => (
                  <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <TextField
          fullWidth
          size="small"
          label="Original Script"
          multiline
          minRows={5}
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder="Paste your script here…"
          sx={{ mb: 2 }}
        />

        <Button
          variant="contained"
          startIcon={mutation.isLoading ? <CircularProgress size={16} color="inherit" /> : <AutoFixHighIcon />}
          onClick={handleImprove}
          disabled={mutation.isLoading || !script.trim()}
        >
          Improve Script
        </Button>

        {mutation.error && (
          <Alert severity="error" sx={{ mt: 2 }}>{String(mutation.error)}</Alert>
        )}

        {improved && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Typography variant="subtitle2">Improved Script</Typography>
              <Button
                size="small"
                startIcon={<ContentCopyIcon />}
                onClick={handleCopy}
                color={copied ? "success" : "inherit"}
              >
                {copied ? "Copied!" : "Copy"}
              </Button>
            </Box>
            <TextField
              fullWidth
              size="small"
              multiline
              minRows={5}
              value={improved}
              InputProps={{ readOnly: true }}
              sx={{
                "& .MuiInputBase-root": { bgcolor: "action.hover" },
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
              Personalised for: <strong>{audience}</strong> · Tone: <strong>{tone}</strong>
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ScriptImprover;
