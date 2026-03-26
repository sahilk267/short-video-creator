import React from "react";
import { Card, CardContent, Chip, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  target?: string;
  createdAt: string;
}

interface AuditLogProps {
  entries: AuditLogEntry[];
}

const AuditLog: React.FC<AuditLogProps> = ({ entries }) => {
  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">Audit Log</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>When</TableCell>
                <TableCell>Actor</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Target</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{new Date(entry.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{entry.actor}</TableCell>
                  <TableCell>
                    <Chip size="small" label={entry.action} />
                  </TableCell>
                  <TableCell>{entry.target ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default AuditLog;
