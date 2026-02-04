import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";

import NiArrowDown from "@/icons/nexture/ni-arrow-down";
import NiArrowUp from "@/icons/nexture/ni-arrow-up";
import NiCheckSquare from "@/icons/nexture/ni-check-square";
import NiChevronDownSmall from "@/icons/nexture/ni-chevron-down-small";
import NiChevronRightSmall from "@/icons/nexture/ni-chevron-right-small";
import NiExclamationSquare from "@/icons/nexture/ni-exclamation-square";
import NiPlus from "@/icons/nexture/ni-plus";
import NiPlusSquare from "@/icons/nexture/ni-plus-square";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useAuth } from "@/contexts/AuthContext";
import type { Task, Area, Employee } from "@sigeo/shared";

type TaskFormState = {
  areaId: string;
  employeeId: string;
  scheduledDate: string;
  title: string;
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente",
  IN_PROGRESS: "Em execução",
  IN_REVIEW: "Em validação",
  DONE: "Concluída",
  REJECTED: "Rejeitada",
};

export function Tasks() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<TaskFormState>({
    areaId: "",
    employeeId: "",
    scheduledDate: "",
    title: "",
  });

  const load = async () => {
    try {
      setError(null);
      const [tasksRes, areasRes, empsRes] = await Promise.all([
        api.get<{ data: Task[] }>("/tasks"),
        api.get<{ data: Area[] }>("/areas"),
        api.get<{ data: Employee[] }>("/employees"),
      ]);
      const a = areasRes.data.data ?? [];
      setTasks(tasksRes.data.data ?? []);
      setAreas(a);
      setEmployees(empsRes.data.data ?? []);
      if (a.length > 0 && !form.areaId) {
        setForm((f) => ({ ...f, areaId: a[0].id }));
      }
    } catch (e: unknown) {
      setSuccess(null);
      setError(getApiErrorMessage(e, "Erro ao carregar tarefas"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!form.areaId || !form.scheduledDate) {
      setError("Selecione a área e a data.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await api.post("/tasks", {
        areaId: form.areaId,
        employeeId: form.employeeId || undefined,
        scheduledDate: form.scheduledDate,
        title: form.title || undefined,
      });
      setForm((f) => ({ ...f, scheduledDate: "", title: "" }));
      setShowForm(false);
      setSuccess("Tarefa cadastrada.");
      await load();
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Erro ao salvar tarefa"));
      setSuccess(null);
    } finally {
      setSaving(false);
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
      <Box className="mb-4 flex flex-row items-center justify-between">
        <Typography variant="h6" component="h1" className="text-text-primary">
          Tarefas / Serviços
        </Typography>
        {user?.role === "ADMIN" && (
          <Button
            variant="contained"
            color="primary"
            size="medium"
            startIcon={<NiPlus size="medium" />}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancelar" : "Nova"}
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" className="mb-4" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" className="mb-4" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {showForm && (
        <Card className="mb-4">
          <CardContent>
            <Typography variant="subtitle1" className="mb-3 font-semibold text-text-primary">
              Nova tarefa
            </Typography>
            <Box
              component="form"
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                save();
              }}
              className="flex flex-wrap gap-4"
            >
              <FormControl variant="outlined" size="small" required className="min-w-48">
                <InputLabel>Área</InputLabel>
                <Select
                  value={form.areaId}
                  onChange={(e) => setForm((f) => ({ ...f, areaId: e.target.value }))}
                  label="Área"
                  IconComponent={NiChevronDownSmall}
                  MenuProps={{ className: "outlined" }}
                >
                  {areas.map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                      {a.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl variant="outlined" size="small" className="min-w-48">
                <InputLabel>Funcionário (opcional)</InputLabel>
                <Select
                  value={form.employeeId}
                  onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
                  label="Funcionário (opcional)"
                  IconComponent={NiChevronDownSmall}
                  MenuProps={{ className: "outlined" }}
                >
                  <MenuItem value="">Nenhum</MenuItem>
                  {employees.map((emp) => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                type="date"
                label="Data"
                size="small"
                required
                value={form.scheduledDate}
                onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))}
                className="min-w-40"
              />
              <TextField
                label="Título (opcional)"
                size="small"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="min-w-48"
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={saving}
              >
                {saving ? "Salvando…" : "Salvar"}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Box className="min-h-64">
            <DataGrid
              rows={tasks}
              columns={taskColumns}
              hideFooter={tasks.length <= 100}
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
                noRowsOverlay: () => (
                  <Box className="flex h-full items-center justify-center">
                    <Typography variant="body2" className="text-text-secondary">
                      Nenhuma tarefa cadastrada.
                    </Typography>
                  </Box>
                ),
              }}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

const taskColumns: GridColDef<Task>[] = [
  {
      field: "title",
      headerName: "Título",
      flex: 1,
      minWidth: 160,
      renderCell: (params: GridRenderCellParams<Task, string>) => (
        <Link
          to={`/tasks/${params.row.id}`}
          className="text-text-primary link-primary link-underline-none font-semibold transition-colors hover:text-primary"
        >
          {params.value ?? "(sem título)"}
        </Link>
      ),
    },
    {
      field: "scheduledDate",
      headerName: "Data",
      type: "dateTime",
      width: 120,
      valueGetter: (value) => (value ? new Date(value) : null),
      valueFormatter: (value) =>
        value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value)) : "",
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 140,
      renderCell: (params: GridRenderCellParams<Task, string>) => {
        const value = params.value;
        const label = STATUS_LABEL[value ?? ""] ?? value;
        if (value === "DONE") {
          return (
            <Button
              className="pointer-events-none self-center"
              size="small"
              color="info"
              variant="pastel"
              startIcon={<NiCheckSquare size="small" />}
            >
              {label}
            </Button>
          );
        }
        if (value === "IN_REVIEW") {
          return (
            <Button
              className="pointer-events-none self-center"
              size="small"
              color="warning"
              variant="pastel"
              startIcon={<NiExclamationSquare size="small" />}
            >
              {label}
            </Button>
          );
        }
        if (value === "REJECTED") {
          return (
            <Button
              className="pointer-events-none self-center"
              size="small"
              color="error"
              variant="pastel"
              startIcon={<NiExclamationSquare size="small" />}
            >
              {label}
            </Button>
          );
        }
        return (
          <Button
            className="pointer-events-none self-center"
            size="small"
            color="success"
            variant="pastel"
            startIcon={<NiPlusSquare size="small" />}
          >
            {label}
          </Button>
        );
      },
    },
    {
      field: "id",
      headerName: "Ações",
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<Task, string>) => (
        <Button
          component={Link}
          to={`/tasks/${params.value}`}
          size="small"
          color="primary"
          variant="text"
          startIcon={<NiChevronRightSmall size="small" className="rtl:rotate-180" />}
        >
          Ver
        </Button>
      ),
    },
  ];
