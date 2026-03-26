/**
 * SchedulePicker Component - Configure publishing schedule
 */

import React from "react";
import {
  Box,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { ScheduleConfig } from "../pages/PublishDashboard";

interface SchedulePickerProps {
  schedule: ScheduleConfig;
  onScheduleChange: (schedule: ScheduleConfig) => void;
}

const TIMEZONES = [
  { label: "UTC", value: "UTC" },
  { label: "America/New_York (EST)", value: "America/New_York" },
  { label: "America/Chicago (CST)", value: "America/Chicago" },
  { label: "America/Denver (MST)", value: "America/Denver" },
  { label: "America/Los_Angeles (PST)", value: "America/Los_Angeles" },
  { label: "Europe/London (GMT)", value: "Europe/London" },
  { label: "Europe/Paris (CET)", value: "Europe/Paris" },
  { label: "Asia/Tokyo (JST)", value: "Asia/Tokyo" },
  { label: "Asia/Shanghai (CST)", value: "Asia/Shanghai" },
  { label: "Asia/Hong_Kong (HKT)", value: "Asia/Hong_Kong" },
  { label: "Asia/Singapore (SGT)", value: "Asia/Singapore" },
  { label: "Asia/Dubai (GST)", value: "Asia/Dubai" },
  { label: "Asia/Kolkata (IST)", value: "Asia/Kolkata" },
  { label: "Australia/Sydney (AEDT)", value: "Australia/Sydney" },
];

export const SchedulePicker: React.FC<SchedulePickerProps> = ({
  schedule,
  onScheduleChange,
}) => {
  const handleScheduleTypeChange = (value: string) => {
    onScheduleChange({
      ...schedule,
      publishImmediately: value === "immediate",
    });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onScheduleChange({
      ...schedule,
      scheduledDate: e.target.value,
    });
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onScheduleChange({
      ...schedule,
      scheduledTime: e.target.value,
    });
  };

  const handleTimezoneChange = (value: string) => {
    onScheduleChange({
      ...schedule,
      timezone: value,
    });
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  return (
    <Box>
      <Stack spacing={3}>
        {/* Schedule Type Selection */}
        <Paper sx={{ p: 2, backgroundColor: "#fafafa" }}>
          <FormControl fullWidth>
            <RadioGroup
              value={schedule.publishImmediately ? "immediate" : "scheduled"}
              onChange={(e) => handleScheduleTypeChange(e.target.value)}
            >
              <FormControlLabel
                value="immediate"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Publish Immediately
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Videos will be published to all platforms right after you confirm
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="scheduled"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Schedule for Later
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Set a specific date and time to publish (across multiple platforms
                      simultaneously)
                    </Typography>
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>
        </Paper>

        {/* Scheduled Date/Time Inputs */}
        {!schedule.publishImmediately && (
          <Stack spacing={2}>
            <TextField
              label="Publish Date"
              type="date"
              required
              fullWidth
              value={schedule.scheduledDate || ""}
              onChange={handleDateChange}
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                min: getMinDate(),
              }}
              helperText="Select a date at least 1 day in the future"
            />

            <TextField
              label="Publish Time"
              type="time"
              required
              fullWidth
              value={schedule.scheduledTime || ""}
              onChange={handleTimeChange}
              InputLabelProps={{
                shrink: true,
              }}
              helperText="In the selected timezone below"
            />

            <FormControl fullWidth>
              <InputLabel id="timezone-label">Timezone</InputLabel>
              <Select
                labelId="timezone-label"
                id="timezone-select"
                value={schedule.timezone || "UTC"}
                label="Timezone"
                onChange={(e) => handleTimezoneChange(e.target.value)}
              >
                {TIMEZONES.map((tz) => (
                  <MenuItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {schedule.scheduledDate && schedule.scheduledTime && (
              <Paper
                sx={{
                  p: 2,
                  backgroundColor: "#e8f5e9",
                  border: "1px solid #4caf50",
                }}
              >
                <Typography variant="body2">
                  <strong>Scheduled for:</strong>{" "}
                  {new Date(`${schedule.scheduledDate}T${schedule.scheduledTime}`).toLocaleString(
                    undefined,
                    {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}{" "}
                  ({schedule.timezone})
                </Typography>
              </Paper>
            )}
          </Stack>
        )}

        {schedule.publishImmediately && (
          <Paper sx={{ p: 2, backgroundColor: "#fff3cd", border: "1px solid #ffc107" }}>
            <Typography variant="body2">
              ⚡ Videos will be published immediately upon confirmation. This action cannot be
              undone.
            </Typography>
          </Paper>
        )}
      </Stack>
    </Box>
  );
};

export default SchedulePicker;
