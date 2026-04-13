import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Alert,
} from "@mui/material";
import { api } from "../services/apiClient";

interface MappingRecord {
  id: string;
  category: string;
  platform: string;
  channelId: string;
}

const CategoryMapping: React.FC = () => {
  const [mappings, setMappings] = useState<MappingRecord[]>([]);
  const [category, setCategory] = useState("World");
  const [platform, setPlatform] = useState("youtube");
  const [channelId, setChannelId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchMappings = async () => {
    try {
      const mappingsResponse = await api.channels.list() as MappingRecord[];
      setMappings(mappingsResponse || []);
    } catch {
      setMappings([]);
    }
  };

  useEffect(() => {
    fetchMappings();
  }, []);

  const saveMapping = async () => {
    setError(null);
    try {
      await api.channels.create({
        category,
        platform,
        channelId,
      });
      setChannelId("");
      await fetchMappings();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to save mapping");
    }
  };

  return (
    <Box maxWidth="md" mx="auto" py={4}>
      <Typography variant="h4" gutterBottom>
        Category Channel Mapping
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Platform" value={platform} onChange={(e) => setPlatform(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Channel ID" value={channelId} onChange={(e) => setChannelId(e.target.value)} />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" onClick={saveMapping}>Save Mapping</Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Existing Mappings</Typography>
        {mappings.length === 0 ? (
          <Typography color="text.secondary">No mappings yet.</Typography>
        ) : mappings.map((m) => (
          <Typography key={m.id}>{m.category} {"->"} {m.platform} ({m.channelId})</Typography>
        ))}
      </Paper>
    </Box>
  );
};

export default CategoryMapping;
