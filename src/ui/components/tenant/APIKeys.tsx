import React, { useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardContent,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import DeleteIcon from "@mui/icons-material/Delete";
import type { TenantApiKey } from "../../hooks/useTenantInfo";

interface APIKeysProps {
  keys: TenantApiKey[];
  creating: boolean;
  regenerating: boolean;
  revoking: boolean;
  latestSecret?: string;
  onCreate: (name: string) => Promise<void>;
  onRegenerate: (keyId: string) => Promise<void>;
  onRevoke: (keyId: string) => Promise<void>;
}

const APIKeys: React.FC<APIKeysProps> = ({
  keys,
  creating,
  regenerating,
  revoking,
  latestSecret,
  onCreate,
  onRegenerate,
  onRevoke,
}) => {
  const [name, setName] = useState("");

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">API Keys</Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Key Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              fullWidth
            />
            <Button
              variant="contained"
              disabled={!name.trim() || creating}
              onClick={async () => {
                await onCreate(name.trim());
                setName("");
              }}
            >
              {creating ? "Generating..." : "Generate Key"}
            </Button>
          </Stack>

          {latestSecret ? (
            <Alert
              severity="success"
              action={
                <Button
                  size="small"
                  onClick={() => navigator.clipboard.writeText(latestSecret)}
                >
                  Copy
                </Button>
              }
            >
              Save this key now. It may not be shown again: {latestSecret}
            </Alert>
          ) : null}

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Prefix</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {keys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell>{key.name}</TableCell>
                  <TableCell>{key.prefix ?? "-"}</TableCell>
                  <TableCell>{key.createdAt ? new Date(key.createdAt).toLocaleString() : "-"}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Copy prefix">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => navigator.clipboard.writeText(key.prefix ?? "")}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Regenerate">
                      <span>
                        <IconButton
                          size="small"
                          disabled={regenerating}
                          onClick={() => onRegenerate(key.id)}
                        >
                          <AutorenewIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Revoke">
                      <span>
                        <IconButton
                          size="small"
                          disabled={revoking}
                          onClick={() => onRevoke(key.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default APIKeys;
