import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Typography,
} from "@mui/material";
import { type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";

import NiCheckSquare from "@/icons/nexture/ni-check-square";
import NiChevronRightSmall from "@/icons/nexture/ni-chevron-right-small";
import NiCrossSquare from "@/icons/nexture/ni-cross-square";
import NiExclamationSquare from "@/icons/nexture/ni-exclamation-square";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import dayjs from "dayjs";

interface TaskPhoto {
  id: string;
  type: string;
  url: string;
}

interface Task {
  id: string;
  title: string | null;
  status: string;
  employeeId: string | null;
  scheduledDate: string;
  areaId: string;
  photos?: TaskPhoto[];
}

export function Validation() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = () => {
    setLoading(true);
    api
      .get<Task[]>("/tasks/validation/queue")
      .then(({ data }) => setTasks(Array.isArray(data) ? data : []))
      .catch(() => setError("Falha ao carregar fila"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const id = setTimeout(() => fetchQueue(), 0);
    return () => clearTimeout(id);
  }, []);

  const handleApprove = async (id: string) => {
    setError(null);
    try {
      await api.post(`/tasks/${id}/approve`);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      setError(getApiErrorMessage(e, "Falha ao aprovar"));
    }
  };

  const handleReject = async (id: string) => {
    const comment = window.prompt("Comentário obrigatório na recusa:");
    if (comment == null || !comment.trim()) return;
    setError(null);
    try {
      await api.post(`/tasks/${id}/reject`, { comment: comment.trim() });
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      setError(getApiErrorMessage(e, "Falha ao recusar"));
    }
  };

  if (loading) {
    return (
      <Box className="flex min-h-40 items-center justify-center">
        <Typography variant="body2" className="text-text-secondary">
          Carregando…
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box className="mb-4 flex items-center gap-2">
        <NiExclamationSquare size="medium" className="text-primary" />
        <Typography variant="h6" component="h1" className="text-text-primary">
          Fila de validação
        </Typography>
      </Box>
      <Typography variant="body2" className="mb-4 text-text-secondary">
        Tarefas aguardando aprovação (status IN_REVIEW). Aprove ou recuse com comentário.
      </Typography>

      {error && (
        <Alert severity="error" className="mb-4" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <NiCheckSquare size="large" className="mb-3 text-text-disabled" />
            <Typography variant="body1" className="font-medium text-text-primary">
              Nenhuma tarefa em validação
            </Typography>
            <Typography variant="body2" className="mt-1 text-text-secondary">
              Todas as tarefas foram validadas ou ainda não foram enviadas.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Box className="min-h-64">
              <DataGrid
                rows={tasks}
                columns={validationColumns(handleApprove, handleReject)}
                hideFooter
                disableColumnFilter
                disableColumnSelector
                disableDensitySelector
                columnHeaderHeight={40}
                disableRowSelectionOnClick
                className="border-none"
                getRowId={(row) => row.id}
              />
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

function validationColumns(
  handleApprove: (id: string) => void,
  handleReject: (id: string) => void,
): GridColDef<Task>[] {
  return [
    {
      field: "title",
      headerName: "Tarefa",
      flex: 1,
      minWidth: 160,
      renderCell: (params: GridRenderCellParams<Task, string>) => (
        <Link
          to={`/tasks/${params.row.id}`}
          className="font-medium text-primary transition-colors hover:text-primary-dark"
        >
          {params.value || params.row.id.slice(0, 8)}
        </Link>
      ),
    },
    {
      field: "employeeId",
      headerName: "Funcionário",
      width: 120,
      valueGetter: (v) => v ?? "—",
    },
    {
      field: "scheduledDate",
      headerName: "Data",
      width: 110,
      valueFormatter: (value) => (value ? dayjs(value).format("DD/MM/YYYY") : "—"),
    },
    {
      field: "photos",
      headerName: "Fotos",
      width: 120,
      valueGetter: (_, row) => {
        const photos = row.photos ?? [];
        const before = photos.filter((p) => p.type === "BEFORE").length;
        const after = photos.filter((p) => p.type === "AFTER").length;
        return `${before} antes / ${after} depois`;
      },
    },
    {
      field: "id",
      headerName: "Ações",
      width: 220,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<Task, string>) => (
        <Box className="flex gap-2">
          <Button
            component={Link}
            to={`/tasks/${params.value}`}
            size="small"
            variant="text"
            color="primary"
            startIcon={<NiChevronRightSmall size="small" className="rtl:rotate-180" />}
          >
            Ver
          </Button>
          <Button
            size="small"
            variant="contained"
            color="success"
            startIcon={<NiCheckSquare size="small" />}
            onClick={() => handleApprove(params.row.id)}
          >
            Aprovar
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<NiCrossSquare size="small" />}
            onClick={() => handleReject(params.row.id)}
          >
            Recusar
          </Button>
        </Box>
      ),
    },
  ];
}
