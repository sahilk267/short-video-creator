/**
 * MetadataEditor Component - Configure metadata per platform
 */

import React from "react";
import {
  Box,
  Tabs,
  Tab,
  TextField,
  Typography,
  Chip,
  Stack,
  Alert,
  Paper,
} from "@mui/material";
import { PlatformMetadata } from "../pages/PublishDashboard";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index } = props;
  return (
    <div hidden={value !== index} role="tabpanel">
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export interface MetadataEditorProps {
  platforms: string[];
  metadata: PlatformMetadata;
  onMetadataChange: (metadata: PlatformMetadata) => void;
}

export const MetadataEditor: React.FC<MetadataEditorProps> = ({
  platforms,
  metadata,
  onMetadataChange,
}) => {
  const [activeTab, setActiveTab] = React.useState(0);

  const handleMetadataUpdate = (platform: string, field: string, value: string | string[]) => {
    const platformKey = platform as keyof PlatformMetadata;
    const existing = metadata[platformKey] || {};

    onMetadataChange({
      ...metadata,
      [platform]: {
        ...existing,
        [field]: value,
      },
    });
  };

  const parseTagsInput = (input: string): string[] => {
    return input
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  };

  const tagsInputValue = (platform: string, field: string) => {
    const platformKey = platform as keyof PlatformMetadata;
    const value = (metadata[platformKey] as Record<string, unknown>)?.[field];
    return Array.isArray(value) ? value.join(", ") : "";
  };

  return (
    <Box>
      {platforms.length === 0 ? (
        <Alert severity="info">Please select at least one platform first.</Alert>
      ) : (
        <>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: "1px solid #e0e0e0", mb: 2 }}
          >
            {platforms.map((platform) => (
              <Tab key={platform} label={platform.toUpperCase()} value={platforms.indexOf(platform)} />
            ))}
          </Tabs>

          {platforms.map((platform, index) => (
            <TabPanel key={platform} value={activeTab} index={index}>
              {platform === "youtube" && (
                <Stack spacing={2}>
                  <TextField
                    label="Video Title"
                    required
                    fullWidth
                    placeholder="Enter YouTube video title (50-100 characters recommended)"
                    value={
                      (metadata.youtube?.title as string) || ""
                    }
                    onChange={(e) => handleMetadataUpdate("youtube", "title", e.target.value)}
                    inputProps={{ maxLength: 100 }}
                    helperText={`${(metadata.youtube?.title as string)?.length || 0}/100`}
                  />
                  <TextField
                    label="Description"
                    required
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Enter YouTube description"
                    value={
                      (metadata.youtube?.description as string) || ""
                    }
                    onChange={(e) => handleMetadataUpdate("youtube", "description", e.target.value)}
                    inputProps={{ maxLength: 5000 }}
                    helperText={`${(metadata.youtube?.description as string)?.length || 0}/5000`}
                  />
                  <TextField
                    label="Tags"
                    fullWidth
                    placeholder="Enter tags separated by commas (e.g. music, trending, news)"
                    value={tagsInputValue("youtube", "tags")}
                    onChange={(e) =>
                      handleMetadataUpdate("youtube", "tags", parseTagsInput(e.target.value))
                    }
                    helperText="Comma-separated tags (max 500 characters total)"
                  />
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Tags:
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
                      {(metadata.youtube?.tags as string[] | undefined)?.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          onDelete={() =>
                            handleMetadataUpdate(
                              "youtube",
                              "tags",
                              ((metadata.youtube?.tags as string[]) || []).filter((t) => t !== tag)
                            )
                          }
                        />
                      ))}
                    </Box>
                  </Box>
                </Stack>
              )}

              {platform === "instagram" && (
                <Stack spacing={2}>
                  <TextField
                    label="Caption"
                    required
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Enter Instagram caption"
                    value={
                      (metadata.instagram?.caption as string) || ""
                    }
                    onChange={(e) => handleMetadataUpdate("instagram", "caption", e.target.value)}
                    inputProps={{ maxLength: 2200 }}
                    helperText={`${(metadata.instagram?.caption as string)?.length || 0}/2200`}
                  />
                  <TextField
                    label="Hashtags"
                    fullWidth
                    placeholder="Enter hashtags separated by commas"
                    value={tagsInputValue("instagram", "hashtags")}
                    onChange={(e) =>
                      handleMetadataUpdate("instagram", "hashtags", parseTagsInput(e.target.value))
                    }
                    helperText="Comma-separated hashtags (recommended: 10-30)"
                  />
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Hashtags:
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
                      {(metadata.instagram?.hashtags as string[] | undefined)?.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          onDelete={() =>
                            handleMetadataUpdate(
                              "instagram",
                              "hashtags",
                              ((metadata.instagram?.hashtags as string[]) || []).filter((t) => t !== tag)
                            )
                          }
                        />
                      ))}
                    </Box>
                  </Box>
                </Stack>
              )}

              {platform === "facebook" && (
                <Stack spacing={2}>
                  <TextField
                    label="Post Title"
                    required
                    fullWidth
                    placeholder="Enter Facebook post title"
                    value={
                      (metadata.facebook?.title as string) || ""
                    }
                    onChange={(e) => handleMetadataUpdate("facebook", "title", e.target.value)}
                    inputProps={{ maxLength: 100 }}
                  />
                  <TextField
                    label="Description"
                    required
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Enter Facebook description"
                    value={
                      (metadata.facebook?.description as string) || ""
                    }
                    onChange={(e) => handleMetadataUpdate("facebook", "description", e.target.value)}
                  />
                  <TextField
                    label="Hashtags"
                    fullWidth
                    placeholder="Enter hashtags separated by commas"
                    value={tagsInputValue("facebook", "hashtags")}
                    onChange={(e) =>
                      handleMetadataUpdate("facebook", "hashtags", parseTagsInput(e.target.value))
                    }
                  />
                </Stack>
              )}

              {platform === "telegram" && (
                <Stack spacing={2}>
                  <TextField
                    label="Caption"
                    required
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Enter Telegram caption (supports markdown)"
                    value={
                      (metadata.telegram?.caption as string) || ""
                    }
                    onChange={(e) => handleMetadataUpdate("telegram", "caption", e.target.value)}
                    helperText="Supports Telegram markdown formatting (*bold*, _italic_, `code`)"
                  />
                </Stack>
              )}

              <Paper sx={{ mt: 2, p: 2, backgroundColor: "#f5f5f5" }}>
                <Typography variant="caption" color="textSecondary">
                  ✓ Required fields must be filled before publishing
                </Typography>
              </Paper>
            </TabPanel>
          ))}
        </>
      )}
    </Box>
  );
};

export default MetadataEditor;
