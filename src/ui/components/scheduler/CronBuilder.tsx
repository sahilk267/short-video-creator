/**
 * CronBuilder – visual cron expression builder with presets + custom editor
 */

import React, { useState, useCallback } from "react";
import {
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  Stack,
  Chip,
  Divider,
  Tooltip,
  Alert,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export interface CronBuilderProps {
  value: string;
  onChange: (cron: string) => void;
}

interface CronPreset {
  label: string;
  value: string;
  description: string;
}

const PRESETS: CronPreset[] = [
  { label: "Every hour", value: "0 * * * *", description: "Runs at the start of every hour" },
  { label: "Every 6h", value: "0 */6 * * *", description: "Runs every 6 hours" },
  { label: "Daily 9am", value: "0 9 * * *", description: "Runs every day at 9:00 AM" },
  { label: "Daily midnight", value: "0 0 * * *", description: "Runs every day at midnight" },
  { label: "Weekly Mon", value: "0 9 * * 1", description: "Runs every Monday at 9:00 AM" },
  { label: "Custom", value: "custom", description: "Enter a custom cron expression" },
];

const CRON_FIELDS = ["Minute", "Hour", "Day", "Month", "Weekday"];

/** Basic cron validation */
function validateCron(expr: string): string | null {
  if (!expr.trim()) return "Cron expression cannot be empty";
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return "Expected 5 fields: minute hour day month weekday";
  return null;
}

/** Human-readable description of a cron expression */
function describeCron(expr: string): string {
  const preset = PRESETS.find((p) => p.value === expr);
  if (preset && preset.value !== "custom") return preset.description;

  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return expr;

  const [min, hour, day, , weekday] = parts;

  if (min === "0" && hour !== "*" && day === "*" && weekday === "*") {
    return `Every day at ${hour.padStart(2, "0")}:00`;
  }
  if (min === "0" && hour === "*") {
    return "Every hour at minute 0";
  }
  if (min.startsWith("*/") && hour === "*") {
    return `Every ${min.slice(2)} minutes`;
  }
  if (hour.startsWith("*/") && min === "0") {
    return `Every ${hour.slice(2)} hours`;
  }
  if (min === "0" && hour !== "*" && weekday !== "*") {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayNum = parseInt(weekday, 10);
    return `Weekly on ${days[dayNum] || weekday} at ${hour.padStart(2, "0")}:00`;
  }
  return `Custom schedule: ${expr}`;
}

export const CronBuilder: React.FC<CronBuilderProps> = ({ value, onChange }) => {
  const isPreset = PRESETS.some((p) => p.value === value && p.value !== "custom");
  const [mode, setMode] = useState<string>(isPreset ? value : "custom");
  const [customExpr, setCustomExpr] = useState<string>(isPreset ? "0 * * * *" : value);

  const validationError = mode === "custom" ? validateCron(customExpr) : null;

  const handleModeChange = useCallback(
    (_: React.MouseEvent<HTMLElement>, newMode: string | null) => {
      if (!newMode) return;
      setMode(newMode);
      if (newMode !== "custom") {
        onChange(newMode);
      } else {
        onChange(customExpr);
      }
    },
    [customExpr, onChange]
  );

  const handleCustomChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setCustomExpr(val);
      if (!validateCron(val)) {
        onChange(val);
      }
    },
    [onChange]
  );

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          Schedule Frequency
        </Typography>
        <Tooltip title="Uses standard cron syntax: minute hour day month weekday">
          <InfoOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
        </Tooltip>
      </Stack>

      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={handleModeChange}
        size="small"
        sx={{ flexWrap: "wrap", gap: 0.5, mb: 2 }}
      >
        {PRESETS.map((preset) => (
          <Tooltip key={preset.value} title={preset.description}>
            <ToggleButton value={preset.value} sx={{ borderRadius: "8px !important", px: 2 }}>
              {preset.label}
            </ToggleButton>
          </Tooltip>
        ))}
      </ToggleButtonGroup>

      {mode === "custom" && (
        <TextField
          fullWidth
          size="small"
          label="Cron expression"
          value={customExpr}
          onChange={handleCustomChange}
          error={!!validationError}
          helperText={validationError || `Fields: ${CRON_FIELDS.join(" | ")}`}
          placeholder="0 * * * *"
          sx={{ mb: 1.5 }}
          inputProps={{ spellCheck: false, style: { fontFamily: "monospace" } }}
        />
      )}

      <Divider sx={{ my: 1.5 }} />

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="caption" color="text.secondary">
          Active expression:
        </Typography>
        <Chip
          label={mode === "custom" ? customExpr : mode}
          size="small"
          variant="outlined"
          color="primary"
          sx={{ fontFamily: "monospace", fontSize: 12 }}
        />
      </Stack>

      {!validationError && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
          {describeCron(mode === "custom" ? customExpr : mode)}
        </Typography>
      )}

      {validationError && (
        <Alert severity="warning" sx={{ mt: 1, py: 0 }} icon={false}>
          <Typography variant="caption">{validationError}</Typography>
        </Alert>
      )}
    </Box>
  );
};

export default CronBuilder;
