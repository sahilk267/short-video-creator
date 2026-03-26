/**
 * Table Component - Reusable data table with sorting, pagination, and actions
 */

import React from "react";
import {
  Table as MUITable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Typography,
  Box,
} from "@mui/material";

export interface Column<T> {
  key: keyof T;
  label: string;
  width?: string | number;
  align?: "left" | "center" | "right";
  render?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: keyof T;
  loading?: boolean;
  pagination?: boolean;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  rowsPerPageOptions?: number[];
  dense?: boolean;
}

export const Table = React.forwardRef<HTMLDivElement, TableProps<unknown>>(
  (
    {
      columns,
      data,
      rowKey,
      loading = false,
      pagination = true,
      onRowClick,
      emptyMessage = "No data available",
      rowsPerPageOptions = [5, 10, 25],
      dense = false,
    },
    ref,
  ) => {
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(rowsPerPageOptions[0]);

    const handleChangePage = (_: unknown, newPage: number) => {
      setPage(newPage);
    };

    const handleChangeRowsPerPage = (
      event: React.ChangeEvent<HTMLInputElement>,
    ) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
    };

    const displayedData = pagination
      ? data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      : data;

    return (
      <TableContainer component={Paper} ref={ref}>
        {data.length === 0 ? (
          <Box p={3} textAlign="center">
            <Typography color="textSecondary">{emptyMessage}</Typography>
          </Box>
        ) : (
          <>
            <MUITable size={dense ? "small" : "medium"}>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  {columns.map((column) => (
                    <TableCell
                      key={String(column.key)}
                      align={column.align || "left"}
                      sx={{ width: column.width, fontWeight: 600 }}
                    >
                      {column.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} align="center">
                      <Typography>Loading...</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedData.map((row) => (
                    <TableRow
                      key={String(row[rowKey as keyof unknown])}
                      onClick={() => onRowClick?.(row)}
                      sx={{
                        cursor: onRowClick ? "pointer" : "inherit",
                        "&:hover": onRowClick ? { backgroundColor: "#f9f9f9" } : {},
                      }}
                    >
                      {columns.map((column) => (
                        <TableCell
                          key={String(column.key)}
                          align={column.align || "left"}
                        >
                          {column.render
                            ? column.render(row[column.key as keyof unknown], row)
                            : String(row[column.key as keyof unknown] || "")}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </MUITable>
            {pagination && (
              <TablePagination
                rowsPerPageOptions={rowsPerPageOptions}
                component="div"
                count={data.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            )}
          </>
        )}
      </TableContainer>
    );
  },
);

Table.displayName = "Table";

export default Table;
