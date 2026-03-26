import React from "react";
import { Box, FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import type { TenantRecord } from "../../hooks/useTenantInfo";

interface WorkspaceSwitcherProps {
  tenants: TenantRecord[];
  value: string;
  onChange: (tenantId: string) => void;
}

const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({ tenants, value, onChange }) => {
  return (
    <Box sx={{ minWidth: 220 }}>
      <FormControl fullWidth size="small">
        <InputLabel id="workspace-switcher-label">Workspace</InputLabel>
        <Select
          labelId="workspace-switcher-label"
          value={value}
          label="Workspace"
          onChange={(event) => onChange(event.target.value as string)}
        >
          {tenants.map((tenant) => (
            <MenuItem key={tenant.id} value={tenant.id}>
              {tenant.workspaceName}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {tenants.length === 0 ? (
        <Typography variant="caption" color="text.secondary">
          No workspaces yet. Create one below.
        </Typography>
      ) : null}
    </Box>
  );
};

export default WorkspaceSwitcher;
