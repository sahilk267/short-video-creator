/**
 * HistoricalTests – table of all variants for the current video with full details
 */

import React, { useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import type { ABVariant } from "../../hooks/useABTestResults";
import { computeCTR, findWinner } from "../../hooks/useABTestResults";

interface HistoricalTestsProps {
  variants: ABVariant[];
  selectedVideoId: string;
  loading: boolean;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function timeAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch {
    return "";
  }
}

function ctrClass(ctr: number): "success" | "warning" | "error" | "default" {
  if (ctr >= 5) return "success";
  if (ctr >= 2) return "warning";
  if (ctr > 0) return "error";
  return "default";
}

type SortField = "variantKey" | "assignedCount" | "clicks" | "ctr" | "createdAt";

export const HistoricalTests: React.FC<HistoricalTestsProps> = ({
  variants,
  selectedVideoId,
  loading,
}) => {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortAsc, setSortAsc] = useState(false);

  const winnerId = findWinner(variants);

  const enriched = variants.map((v) => ({ ...v, ctr: computeCTR(v) }));

  const filtered = enriched.filter((v) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return v.variantKey.toLowerCase().includes(q) || v.title.toLowerCase().includes(q);
  });

  const sorted = [...filtered].sort((a, b) => {
    let diff = 0;
    if (sortField === "variantKey") diff = a.variantKey.localeCompare(b.variantKey);
    else if (sortField === "assignedCount") diff = a.assignedCount - b.assignedCount;
    else if (sortField === "clicks") diff = a.clicks - b.clicks;
    else if (sortField === "ctr") diff = a.ctr - b.ctr;
    else diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return sortAsc ? diff : -diff;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  const SortHeader: React.FC<{ field: SortField; label: string; align?: "right" | "left" }> = ({
    field,
    label,
    align = "left",
  }) => (
    <TableCell
      align={align}
      onClick={() => handleSort(field)}
      sx={{
        cursor: "pointer",
        userSelect: "none",
        "&:hover": { bgcolor: "grey.100" },
        fontWeight: sortField === field ? 700 : 400,
      }}
    >
      {label}{" "}
      {sortField === field ? (sortAsc ? "↑" : "↓") : ""}
    </TableCell>
  );

  if (!selectedVideoId) {
    return <Alert severity="info">Select a video to view its test history.</Alert>;
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (variants.length === 0) {
    return (
      <Alert severity="info">No test history for this video yet.</Alert>
    );
  }

  return (
    <Box>
      {/* Stats summary */}
      <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>{variants.length}</Typography>
          <Typography variant="caption" color="text.secondary">Total Variants</Typography>
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {variants.reduce((s, v) => s + v.assignedCount, 0).toLocaleString()}
          </Typography>
          <Typography variant="caption" color="text.secondary">Total Assignments</Typography>
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {variants.reduce((s, v) => s + v.clicks, 0).toLocaleString()}
          </Typography>
          <Typography variant="caption" color="text.secondary">Total Clicks</Typography>
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700} color="success.main">
            {enriched.length > 0
              ? `${(enriched.reduce((s, v) => s + v.ctr, 0) / enriched.length).toFixed(2)}%`
              : "0%"}
          </Typography>
          <Typography variant="caption" color="text.secondary">Avg CTR</Typography>
        </Box>
      </Stack>

      {/* Search */}
      <TextField
        size="small"
        placeholder="Search by variant key or title…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 1.5, width: 320 }}
      />

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
        Showing {sorted.length} of {variants.length} variants — click column headers to sort
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "grey.50" }}>
              <TableCell width={24} />
              <SortHeader field="variantKey" label="Variant Key" />
              <TableCell>Title</TableCell>
              <SortHeader field="assignedCount" label="Assignments" align="right" />
              <SortHeader field="clicks" label="Clicks" align="right" />
              <SortHeader field="ctr" label="CTR %" align="right" />
              <TableCell>Thumbnail</TableCell>
              <SortHeader field="createdAt" label="Created" />
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3, color: "text.secondary" }}>
                  No results match your search
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((v) => {
                const isWinner = v.id === winnerId;
                return (
                  <TableRow
                    key={v.id}
                    hover
                    sx={{
                      borderLeft: isWinner ? "3px solid" : "3px solid transparent",
                      borderColor: isWinner ? "success.main" : "transparent",
                    }}
                  >
                    <TableCell padding="checkbox">
                      {isWinner && (
                        <Tooltip title="Winner — highest CTR">
                          <EmojiEventsIcon sx={{ fontSize: 16, color: "success.main" }} />
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={v.variantKey}
                        size="small"
                        color={v.variantKey === "control" ? "default" : "primary"}
                        variant={isWinner ? "filled" : "outlined"}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 280 }}>
                        {v.title}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        {v.assignedCount.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{v.clicks.toLocaleString()}</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${v.ctr.toFixed(2)}%`}
                        size="small"
                        color={ctrClass(v.ctr)}
                      />
                    </TableCell>
                    <TableCell>
                      {v.thumbnail ? (
                        <Typography
                          variant="caption"
                          component="a"
                          href={v.thumbnail}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ color: "primary.main", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                        >
                          View
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.secondary">—</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title={formatDate(v.createdAt)}>
                        <Typography variant="caption" color="text.secondary">
                          {timeAgo(v.createdAt)}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default HistoricalTests;
