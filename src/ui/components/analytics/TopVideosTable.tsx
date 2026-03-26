/**
 * TopVideosTable Component - Ranked list of best-performing videos
 */

import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  LinearProgress,
  Chip,
  Tooltip,
  Skeleton,
  TextField,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { VideoAnalytics } from "../../hooks/useAnalytics";

interface TopVideosTableProps {
  videos: VideoAnalytics[];
  loading?: boolean;
}

type SortKey = "views" | "likes" | "shares" | "comments" | "ctr";

const PLATFORM_COLORS: Record<string, string> = {
  youtube: "#FF0000",
  telegram: "#0088cc",
  instagram: "#C13584",
  facebook: "#1877F2",
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return (n || 0).toLocaleString();
}

function InlineBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Typography variant="body2" sx={{ minWidth: 48, textAlign: "right" }}>
        {formatNumber(value)}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          flex: 1,
          height: 6,
          borderRadius: 3,
          backgroundColor: "#f0f0f0",
          "& .MuiLinearProgress-bar": { backgroundColor: color },
        }}
      />
    </Box>
  );
}

export const TopVideosTable: React.FC<TopVideosTableProps> = ({ videos, loading = false }) => {
  const [sortKey, setSortKey] = useState<SortKey>("views");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const filtered = videos
    .filter((v) => !search || (v.title || v.videoId).toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const aVal = a[sortKey] || 0;
      const bVal = b[sortKey] || 0;
      return sortDir === "desc" ? bVal - aVal : aVal - bVal;
    });

  const maxViews = Math.max(...filtered.map((v) => v.views || 0), 1);
  const maxEngagement = Math.max(...filtered.map((v) => (v.likes || 0) + (v.shares || 0)), 1);
  const maxCTR = Math.max(...filtered.map((v) => v.ctr || 0), 1);

  if (loading) return <Skeleton variant="rounded" height={400} />;

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          Top Performing Videos
        </Typography>
        <TextField
          size="small"
          placeholder="Search videos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ width: 220 }}
        />
      </Box>

      {filtered.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 6, color: "text.secondary" }}>
          <Typography variant="body2">
            {search ? "No videos match your search." : "No video data available."}
          </Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Video</TableCell>
                <TableCell>Platform</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortKey === "views"}
                    direction={sortKey === "views" ? sortDir : "desc"}
                    onClick={() => handleSort("views")}
                  >
                    Views
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortKey === "likes"}
                    direction={sortKey === "likes" ? sortDir : "desc"}
                    onClick={() => handleSort("likes")}
                  >
                    Likes
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortKey === "shares"}
                    direction={sortKey === "shares" ? sortDir : "desc"}
                    onClick={() => handleSort("shares")}
                  >
                    Shares
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortKey === "ctr"}
                    direction={sortKey === "ctr" ? sortDir : "desc"}
                    onClick={() => handleSort("ctr")}
                  >
                    CTR %
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.slice(0, 15).map((video, idx) => {
                const platformColor =
                  PLATFORM_COLORS[video.platform?.toLowerCase()] || "#757575";
                return (
                  <TableRow key={video.videoId} hover>
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color={idx < 3 ? "primary" : "textSecondary"}
                      >
                        {idx + 1}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={video.videoId} placement="top">
                        <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 200 }}>
                          {video.title || video.videoId.substring(0, 16) + "..."}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={video.platform?.toUpperCase() || "—"}
                        size="small"
                        sx={{
                          backgroundColor: platformColor + "22",
                          color: platformColor,
                          fontWeight: 600,
                          fontSize: "0.7rem",
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 150 }}>
                      <InlineBar value={video.views || 0} max={maxViews} color="#1565c0" />
                    </TableCell>
                    <TableCell sx={{ minWidth: 130 }}>
                      <InlineBar value={video.likes || 0} max={maxEngagement} color="#4caf50" />
                    </TableCell>
                    <TableCell sx={{ minWidth: 130 }}>
                      <InlineBar value={video.shares || 0} max={maxEngagement} color="#2196f3" />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ color: video.ctr >= 5 ? "#2e7d32" : video.ctr >= 2 ? "#f57c00" : "#c62828" }}
                      >
                        {(video.ctr || 0).toFixed(2)}%
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

export default TopVideosTable;
