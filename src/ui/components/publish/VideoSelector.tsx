/**
 * VideoSelector Component - Multi-select videos for publishing
 */

import React, { useState } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  TextField,
  Typography,
  Chip,
  CircularProgress,
} from "@mui/material";
import { Checkbox, ListItemIcon } from "@mui/material";
import { InputAdornment } from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import { SelectedVideo } from "../../pages/PublishDashboard";

export interface VideoSelectorProps {
  videos: unknown[];
  selected: SelectedVideo[];
  onSelectionChange: (videos: SelectedVideo[]) => void;
  isLoading?: boolean;
}

export const VideoSelector: React.FC<VideoSelectorProps> = ({
  videos,
  selected,
  onSelectionChange,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Type assertion for videos
  const videoList = (videos || []) as Array<{ id: string; status?: string }>;

  const filtered = videoList.filter((v) =>
    v.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggle = (video: typeof videoList[0]) => {
    const isSelected = selected.some((v) => v.id === video.id);
    if (isSelected) {
      onSelectionChange(selected.filter((v) => v.id !== video.id));
    } else {
      onSelectionChange([
        ...selected,
        {
          id: video.id,
          name: `Video ${video.id.substring(0, 8)}...`,
        },
      ]);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (videoList.length === 0) {
    return (
      <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
        No videos available. Create one first in the Video Creator.
      </Typography>
    );
  }

  return (
    <Box>
      <TextField
        fullWidth
        placeholder="Search videos by ID..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: "text.secondary" }} />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />

      <Box sx={{ mb: 2 }}>
        {selected.length > 0 && (
          <Box>
            <Typography variant="caption" color="textSecondary">
              Selected ({selected.length})
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
              {selected.map((v) => (
                <Chip
                  key={v.id}
                  label={v.name}
                  onDelete={() =>
                    onSelectionChange(selected.filter((s) => s.id !== v.id))
                  }
                  size="small"
                />
              ))}
            </Box>
          </Box>
        )}
      </Box>

      <List
        sx={{
          border: "1px solid #e0e0e0",
          borderRadius: 1,
          maxHeight: 400,
          overflow: "auto",
        }}
      >
        {filtered.map((video) => {
          const isSelected = selected.some((v) => v.id === video.id);
          return (
            <ListItem key={video.id} disablePadding>
              <ListItemButton
                onClick={() => handleToggle(video)}
                sx={{ py: 1 }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Checkbox
                    edge="start"
                    checked={isSelected}
                    tabIndex={-1}
                    disableRipple
                  />
                </ListItemIcon>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
                  <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                    {video.id}
                  </Typography>
                  <Chip
                    label={video.status || "ready"}
                    size="small"
                    color={
                      video.status === "ready"
                        ? "success"
                        : video.status === "processing"
                          ? "warning"
                          : "error"
                    }
                    variant="outlined"
                  />
                </Box>
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: "block" }}>
        {filtered.length} video(s) available • {selected.length} selected
      </Typography>
    </Box>
  );
};

export default VideoSelector;
