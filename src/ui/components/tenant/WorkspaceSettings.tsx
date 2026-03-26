import React, { useEffect, useState } from "react";
import { Card, CardContent, Stack, TextField, Typography, Button } from "@mui/material";
import type { TenantRecord } from "../../hooks/useTenantInfo";

interface WorkspaceSettingsProps {
  tenant: TenantRecord | null;
  onSave: (payload: { workspaceName: string; description?: string; logoUrl?: string }) => Promise<void>;
  saving: boolean;
}

const WorkspaceSettings: React.FC<WorkspaceSettingsProps> = ({ tenant, onSave, saving }) => {
  const [workspaceName, setWorkspaceName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    setWorkspaceName(tenant?.workspaceName ?? "");
    setDescription(tenant?.description ?? "");
    setLogoUrl(tenant?.logoUrl ?? "");
  }, [tenant]);

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">Workspace Settings</Typography>
          <TextField
            label="Workspace Name"
            value={workspaceName}
            onChange={(event) => setWorkspaceName(event.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            multiline
            minRows={2}
            fullWidth
          />
          <TextField
            label="Logo URL"
            value={logoUrl}
            onChange={(event) => setLogoUrl(event.target.value)}
            fullWidth
          />
          <Button
            variant="contained"
            disabled={!tenant || !workspaceName.trim() || saving}
            onClick={() => onSave({ workspaceName: workspaceName.trim(), description: description.trim(), logoUrl: logoUrl.trim() })}
          >
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default WorkspaceSettings;
