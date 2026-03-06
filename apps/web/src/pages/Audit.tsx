import { Box, Card, CardContent, Typography } from "@mui/material";
import { type GridColDef } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";

import { dataGridLocalePtBR } from "@/lib/data-grid-locale";
import NiArrowDown from "@/icons/nexture/ni-arrow-down";
import NiArrowUp from "@/icons/nexture/ni-arrow-up";

const MOCK_ROWS = [
  { id: "1", userId: "u1", action: "CREATE", entity: "Employee", entityId: "e1", createdAt: "2025-01-27 10:00" },
  { id: "2", userId: "u1", action: "UPDATE", entity: "Task", entityId: "t1", createdAt: "2025-01-27 09:30" },
];

type AuditRow = (typeof MOCK_ROWS)[number];

const auditColumns: GridColDef<AuditRow>[] = [
  { field: "createdAt", headerName: "Data", width: 160 },
  { field: "userId", headerName: "Usuário", width: 100 },
  { field: "action", headerName: "Ação", width: 100 },
  { field: "entity", headerName: "Entidade", width: 120 },
  { field: "entityId", headerName: "ID", width: 100 },
];

export function Audit() {
  return (
    <Box>
      <Typography variant="h6" component="h1" className="mb-4 text-text-primary">
        Auditoria de ações
      </Typography>
      <Card>
        <CardContent className="p-0">
          <Box className="min-h-48">
            <DataGrid
              rows={MOCK_ROWS}
              columns={auditColumns}
              localeText={dataGridLocalePtBR}
              initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
              pageSizeOptions={[10, 25, 50]}
              disableColumnFilter
              disableColumnSelector
              disableDensitySelector
              columnHeaderHeight={40}
              disableRowSelectionOnClick
              className="border-none"
              getRowId={(row) => row.id}
              slots={{
                columnSortedDescendingIcon: () => <NiArrowDown size="small" />,
                columnSortedAscendingIcon: () => <NiArrowUp size="small" />,
              }}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
