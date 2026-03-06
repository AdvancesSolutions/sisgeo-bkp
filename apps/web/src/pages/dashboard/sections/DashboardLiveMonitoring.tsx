import dayjs from "dayjs";
import "dayjs/locale/pt";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";

import NiChevronRightSmall from "@/icons/nexture/ni-chevron-right-small";
import NiCheckSquare from "@/icons/nexture/ni-check-square";
import NiCrossSquare from "@/icons/nexture/ni-cross-square";
import NiExclamationSquare from "@/icons/nexture/ni-exclamation-square";
import NiPlusSquare from "@/icons/nexture/ni-plus-square";
import { dataGridLocalePtBR } from "@/lib/data-grid-locale";
import api from "@/lib/api";

interface TaskRow {
  id: string;
  title: string | null;
  status: string;
  scheduledDate: string;
  scheduledTime: string | null;
  startedAt: string | null;
  completedAt: string | null;
  areaName: string;
  riskClassification: string | null;
  employeeName: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente",
  IN_PROGRESS: "Em execução",
  IN_REVIEW: "Em validação",
  DONE: "Concluída",
  LATE: "Atrasado",
  REJECTED: "Reprovado",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: "#64748b",
  IN_PROGRESS: "#0ea5e9",
  IN_REVIEW: "#f59e0b",
  DONE: "#22c55e",
  LATE: "#ef4444",
  REJECTED: "#8b5cf6",
};

export default function DashboardLiveMonitoring() {
  const [rows, setRows] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [riskFilter, setRiskFilter] = useState<string>("");

  const fetchTasks = () => {
    setLoading(true);
    const params: Record<string, string> = { date };
    if (statusFilter) params.status = statusFilter;
    if (riskFilter) params.riskClassification = riskFilter;
    api
      .get<TaskRow[]>("/dashboard/tasks", { params })
      .then(({ data }) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTasks();
  }, [date, statusFilter, riskFilter]);

  return (
    <Box>
      <Box className="mb-3 flex flex-wrap items-center gap-3">
        <Typography variant="h6" component="h6" className="text-text-primary">
          Monitoramento Live
        </Typography>
        <FormControl size="small" variant="outlined" sx={{ minWidth: 140 }}>
          <InputLabel>Data</InputLabel>
          <Select
            value={date}
            onChange={(e) => setDate(e.target.value)}
            label="Data"
          >
            <MenuItem value={dayjs().format("YYYY-MM-DD")}>Hoje</MenuItem>
            <MenuItem value={dayjs().subtract(1, "day").format("YYYY-MM-DD")}>Ontem</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" variant="outlined" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Status"
          >
            <MenuItem value="">Todos</MenuItem>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <MenuItem key={k} value={k}>{v}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" variant="outlined" sx={{ minWidth: 140 }}>
          <InputLabel>Risco</InputLabel>
          <Select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            label="Risco"
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="crítico">Crítico</MenuItem>
            <MenuItem value="semicrítico">Semicrítico</MenuItem>
            <MenuItem value="não crítico">Não crítico</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Card>
        <CardContent className="p-0">
          <Box className="min-h-64">
            <DataGrid
              rows={rows}
              columns={columns}
              localeText={dataGridLocalePtBR}
              initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
              pageSizeOptions={[10, 25, 50]}
              disableColumnFilter
              disableColumnSelector
              disableDensitySelector
              columnHeaderHeight={40}
              disableRowSelectionOnClick
              loading={loading}
              className="border-none"
              getRowId={(row) => row.id}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

const columns: GridColDef<TaskRow>[] = [
  {
    field: "title",
    headerName: "Tarefa",
    flex: 1,
    minWidth: 160,
    renderCell: (params: GridRenderCellParams<TaskRow, string>) => (
      <Link
        to={`/tasks/${params.row.id}`}
        className="font-medium text-primary transition-colors hover:text-primary-dark"
      >
        {params.value || params.row.areaName || params.row.id.slice(0, 8)}
      </Link>
    ),
  },
  {
    field: "areaName",
    headerName: "Setor",
    width: 140,
  },
  {
    field: "riskClassification",
    headerName: "Risco",
    width: 100,
    renderCell: (params: GridRenderCellParams<TaskRow, string | null>) => {
      const v = params.value;
      if (!v) return "—";
      const isCritico = v === "crítico" || v === "CRITICO";
      return (
        <Box
          component="span"
          sx={{
            px: 1,
            py: 0.25,
            borderRadius: 1,
            fontSize: 12,
            fontWeight: 600,
            bgcolor: isCritico ? "error.light" : "grey.200",
            color: isCritico ? "error.contrastText" : "text.secondary",
          }}
        >
          {v}
        </Box>
      );
    },
  },
  {
    field: "employeeName",
    headerName: "Colaborador",
    width: 140,
    valueGetter: (v) => v ?? "—",
  },
  {
    field: "status",
    headerName: "Status",
    width: 130,
    renderCell: (params: GridRenderCellParams<TaskRow, string>) => {
      const value = params.value ?? "";
      const label = STATUS_LABEL[value] ?? value;
      const color = STATUS_COLOR[value] ?? "#64748b";
      return (
        <Box
          component="span"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            fontSize: 12,
            fontWeight: 600,
            backgroundColor: `${color}20`,
            color,
          }}
        >
          {value === "DONE" && <NiCheckSquare size="small" />}
          {value === "REJECTED" && <NiCrossSquare size="small" />}
          {value === "IN_REVIEW" && <NiExclamationSquare size="small" />}
          {value === "PENDING" && <NiPlusSquare size="small" />}
          {label}
        </Box>
      );
    },
  },
  {
    field: "scheduledTime",
    headerName: "Horário",
    width: 80,
    valueGetter: (_, row) =>
      row.scheduledTime ? String(row.scheduledTime).slice(0, 5) : "—",
  },
  {
    field: "startedAt",
    headerName: "Check-in",
    width: 90,
    valueFormatter: (v) => (v ? dayjs(v).format("HH:mm") : "—"),
  },
  {
    field: "id",
    headerName: "Ação",
    width: 120,
    sortable: false,
    filterable: false,
    renderCell: (params: GridRenderCellParams<TaskRow, string>) => (
      <Button
        component={Link}
        to={`/tasks/${params.value}`}
        size="small"
        variant="text"
        color="primary"
        startIcon={<NiChevronRightSmall size="small" className="rtl:rotate-180" />}
      >
        Evidências
      </Button>
    ),
  },
];
