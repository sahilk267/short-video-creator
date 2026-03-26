import React, { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import type { TenantMember } from "../../hooks/useTenantInfo";

interface TeamMembersProps {
  members: TenantMember[];
  inviting: boolean;
  removing: boolean;
  onInvite: (payload: { email: string; role: "admin" | "editor" | "viewer" }) => Promise<void>;
  onRemove: (memberId: string) => Promise<void>;
}

const TeamMembers: React.FC<TeamMembersProps> = ({ members, inviting, removing, onInvite, onRemove }) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "editor" | "viewer">("viewer");

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">Team Members</Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              fullWidth
            />
            <TextField
              select
              label="Role"
              value={role}
              onChange={(event) => setRole(event.target.value as "admin" | "editor" | "viewer")}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="editor">Editor</MenuItem>
              <MenuItem value="viewer">Viewer</MenuItem>
            </TextField>
            <Button
              variant="contained"
              disabled={!email.trim() || inviting}
              onClick={async () => {
                await onInvite({ email: email.trim(), role });
                setEmail("");
                setRole("viewer");
              }}
            >
              {inviting ? "Inviting..." : "Invite"}
            </Button>
          </Stack>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Chip label={member.role} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      disabled={removing || member.role === "owner"}
                      onClick={() => onRemove(member.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
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

export default TeamMembers;
