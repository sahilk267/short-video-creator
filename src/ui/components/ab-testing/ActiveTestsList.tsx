/**
 * ActiveTestsList – list all variants for the selected video with live stats
 */

import React from "react";
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
  Button,
  Alert,
  LinearProgress,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import SendIcon from "@mui/icons-material/Send";
import RefreshIcon from "@mui/icons-material/Refresh";
import type { ABVariant } from "../../hooks/useABTestResults";
import { computeCTR, findWinner } from "../../hooks/useABTestResults";
import { useAssignVariant } from "../../hooks/useABTestMutation";

interface ActiveTestsListProps {
  variants: ABVariant[];
  selectedVideoId: string;
  loading: boolean;
  onRefresh: () => void;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export const ActiveTestsList: React.FC<ActiveTestsListProps> = ({
  variants,
  selectedVideoId,
  loading,
  onRefresh,
}) => {
  const { assignVariant, loading: assigning } = useAssignVariant();
  const winnerId = findWinner(variants);
  const maxAssigned = Math.max(...variants.map((v) => v.assignedCount), 1);

  const handleAssign = async () => {
    const result = await assignVariant(selectedVideoId);
    if (result) onRefresh();
  };

  if (!selectedVideoId) {
    return (
      <Alert severity="info">Select a video to view its A/B test variants.</Alert>
    );
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
      <Alert severity="info">
        No variants found for this video. Create a variant using the "Create Test" tab.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="subtitle2" fontWeight={600}>
            {variants.length} variant{variants.length !== 1 ? "s" : ""} for this video
          </Typography>
          {winnerId && (
            <Chip
              icon={<EmojiEventsIcon sx={{ fontSize: 14 }} />}
              label="Winner identified"
              size="small"
              color="success"
              variant="outlined"
            />
          )}
        </Stack>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Randomly assign least-served variant to next viewer">
            <Button
              size="small"
              variant="outlined"
              startIcon={assigning ? <CircularProgress size={14} /> : <SendIcon />}
              onClick={handleAssign}
              disabled={assigning || variants.length === 0}
            >
              Assign Variant
            </Button>
          </Tooltip>
          <Tooltip title="Refresh variant data">
            <Button size="small" variant="text" startIcon={<RefreshIcon />} onClick={onRefresh}>
              Refresh
            </Button>
          </Tooltip>
        </Stack>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "grey.50" }}>
              <TableCell width={24} />
              <TableCell>Variant Key</TableCell>
              <TableCell>Title</TableCell>
              <TableCell align="right">Assignments</TableCell>
              <TableCell align="right">Clicks</TableCell>
              <TableCell align="right">CTR %</TableCell>
              <TableCell>Assignment Share</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {variants.map((variant) => {
              const ctr = computeCTR(variant);
              const isWinner = variant.id === winnerId;
              const fraction = variant.assignedCount / maxAssigned;
              return (
                <TableRow
                  key={variant.id}
                  hover
                  sx={{
                    bgcolor: isWinner ? "success.50" : undefined,
                    borderLeft: isWinner ? "3px solid" : "3px solid transparent",
                    borderColor: isWinner ? "success.main" : "transparent",
                  }}
                >
                  <TableCell padding="checkbox">
                    {isWinner && (
                      <Tooltip title="Current winner (highest CTR)">
                        <EmojiEventsIcon sx={{ fontSize: 16, color: "success.main" }} />
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={variant.variantKey}
                      size="small"
                      color={variant.variantKey === "control" ? "default" : "primary"}
                      variant={isWinner ? "filled" : "outlined"}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                      {variant.title}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600}>
                      {variant.assignedCount.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{variant.clicks.toLocaleString()}</TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color={ctr > 5 ? "success.main" : ctr > 2 ? "warning.main" : "text.secondary"}
                    >
                      {ctr.toFixed(2)}%
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 120 }}>
                    <Tooltip title={`${variant.assignedCount} assignments`}>
                      <LinearProgress
                        variant="determinate"
                        value={fraction * 100}
                        sx={{ height: 8, borderRadius: 4 }}
                        color={isWinner ? "success" : "primary"}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(variant.createdAt)}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
        "Assign Variant" picks the variant with the fewest assignments to ensure even traffic distribution.
      </Typography>
    </Box>
  );
};

export default ActiveTestsList;
