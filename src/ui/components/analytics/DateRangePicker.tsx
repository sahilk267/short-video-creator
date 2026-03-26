/**
 * DateRangePicker Component - Select predefined or custom date ranges
 */

import React from "react";
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  Stack,
  Typography,
  Collapse,
} from "@mui/material";
import { DateRange } from "../../hooks/useAnalytics";

interface DateRangePickerProps {
  value: DateRange;
  customStart: string;
  customEnd: string;
  onChange: (range: DateRange) => void;
  onCustomStartChange: (date: string) => void;
  onCustomEndChange: (date: string) => void;
}

const PRESETS: { value: DateRange; label: string }[] = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "custom", label: "Custom" },
];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  customStart,
  customEnd,
  onChange,
  onCustomStartChange,
  onCustomEndChange,
}) => {
  const maxDate = new Date().toISOString().split("T")[0];

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
        <ToggleButtonGroup
          value={value}
          exclusive
          onChange={(_, newValue) => {
            if (newValue) onChange(newValue as DateRange);
          }}
          size="small"
          sx={{ flexWrap: "nowrap" }}
        >
          {PRESETS.map((p) => (
            <ToggleButton
              key={p.value}
              value={p.value}
              sx={{ px: 2, fontWeight: 500, textTransform: "none" }}
            >
              {p.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>

      <Collapse in={value === "custom"}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }} alignItems={{ sm: "center" }}>
          <Typography variant="body2" color="textSecondary" sx={{ minWidth: 60 }}>
            From:
          </Typography>
          <TextField
            type="date"
            size="small"
            value={customStart}
            onChange={(e) => onCustomStartChange(e.target.value)}
            inputProps={{ max: customEnd || maxDate }}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 160 }}
          />
          <Typography variant="body2" color="textSecondary">
            To:
          </Typography>
          <TextField
            type="date"
            size="small"
            value={customEnd}
            onChange={(e) => onCustomEndChange(e.target.value)}
            inputProps={{ min: customStart, max: maxDate }}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 160 }}
          />
        </Stack>
      </Collapse>
    </Box>
  );
};

export default DateRangePicker;
