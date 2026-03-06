import { useState, useEffect } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import NiChevronDownSmall from "@/icons/nexture/ni-chevron-down-small";
import NiCross from "@/icons/nexture/ni-cross";
import NiPlus from "@/icons/nexture/ni-plus";
import { dataGridLocalePtBR } from "@/lib/data-grid-locale";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import type { Employee, Location } from "@sigeo/shared";

type EmployeeStatus = "ACTIVE" | "INACTIVE" | "ON_LEAVE";
type EmployeeFormState = {
  name: string;
  cpf: string;
  role: string;
  status: EmployeeStatus;
  unitId: string;
};

const emptyForm: EmployeeFormState = {
  name: "",
  cpf: "",
  role: "",
  status: "ACTIVE",
  unitId: "",
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  ON_LEAVE: "Afastado",
};

export function Employees() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EmployeeFormState>(emptyForm);

  const load = async () => {
    try {
      setError(null);
      const [empRes, locRes] = await Promise.all([
        api.get<{ data: Employee[] }>("/employees"),
        api.get<{ data: Location[] }>("/locations"),
      ]);
      setEmployees(empRes.data.data ?? []);
      setLocations(locRes.data.data ?? []);
      if ((locRes.data.data?.length ?? 0) > 0 && !form.unitId) {
        setForm((f) => ({ ...f, unitId: locRes.data.data![0].id }));
      }
    } catch (e: unknown) {
      setSuccess(null);
      setError(getApiErrorMessage(e, "Erro ao carregar funcionários"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.role.trim() || !form.unitId) {
      setError("Preencha Nome, Função e Unidade.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const payload = {
        name: form.name.trim(),
        cpf: form.cpf.trim() || undefined,
        role: form.role.trim(),
        status: form.status,
        unitId: form.unitId,
      };
      if (editingId) {
        await api.patch(`/employees/${editingId}`, payload);
        setSuccess("Funcionário atualizado.");
      } else {
        await api.post("/employees", payload);
        setSuccess("Funcionário cadastrado.");
      }
      closeModal();
      await load();
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Erro ao salvar funcionário"));
      setSuccess(null);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setForm({
      name: emp.name,
      cpf: emp.cpf ?? "",
      role: emp.role,
      status: emp.status as EmployeeStatus,
      unitId: emp.unitId,
    });
    setShowForm(true);
  };

  const openNew = () => {
    setEditingId(null);
    setForm((f) => ({ ...emptyForm, unitId: f.unitId }));
    setShowForm(true);
  };

  const closeModal = () => {
    setEditingId(null);
    setForm((f) => ({ ...emptyForm, unitId: f.unitId }));
    setShowForm(false);
  };

  const handleDelete = async (emp: Employee) => {
    if (!window.confirm(`Excluir o funcionário "${emp.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      setError(null);
      setSuccess(null);
      await api.delete(`/employees/${emp.id}`);
      setSuccess("Funcionário excluído.");
      await load();
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Erro ao excluir funcionário"));
      setSuccess(null);
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
          Funcionários
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="medium"
          startIcon={<NiPlus size="medium" />}
          onClick={openNew}
        >
          Novo
        </Button>
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

      <Dialog open={showForm} onClose={closeModal} maxWidth="sm" fullWidth>
        <DialogTitle className="border-grey-100 border-b py-4">
          {editingId ? "Editar funcionário" : "Novo funcionário"}
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent className="flex flex-col gap-4 pt-6">
            <TextField
              label="Nome"
              size="small"
              required
              fullWidth
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <TextField
              label="CPF"
              size="small"
              fullWidth
              value={form.cpf}
              onChange={(e) => setForm((f) => ({ ...f, cpf: e.target.value }))}
            />
            <TextField
              label="Função"
              size="small"
              required
              fullWidth
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            />
            <FormControl variant="outlined" size="small" required fullWidth>
              <InputLabel>Unidade</InputLabel>
              <Select
                value={form.unitId}
                onChange={(e) => setForm((f) => ({ ...f, unitId: e.target.value }))}
                label="Unidade"
                IconComponent={NiChevronDownSmall}
                MenuProps={{ className: "outlined" }}
              >
                {locations.map((loc) => (
                  <MenuItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl variant="outlined" size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as EmployeeStatus }))}
                label="Status"
                IconComponent={NiChevronDownSmall}
                MenuProps={{ className: "outlined" }}
              >
                <MenuItem value="ACTIVE">Ativo</MenuItem>
                <MenuItem value="INACTIVE">Inativo</MenuItem>
                <MenuItem value="ON_LEAVE">Afastado</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions className="gap-2 px-6 pb-4">
            <Button variant="outlined" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={saving}>
              {saving ? "Salvando…" : "Salvar"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          <Box className="min-h-64">
            <DataGrid
              rows={employees}
              columns={employeeColumns(locations, startEdit, handleDelete)}
              localeText={dataGridLocalePtBR}
              initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
              pageSizeOptions={[10, 25, 50, 100]}
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
                      Nenhum funcionário cadastrado.
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

function employeeColumns(
  locations: Location[],
  startEdit: (emp: Employee) => void,
  handleDelete: (emp: Employee) => void,
): GridColDef<Employee>[] {
  return [
    { field: "name", headerName: "Nome", flex: 1, minWidth: 140 },
    { field: "cpf", headerName: "CPF", width: 120, valueGetter: (v) => v ?? "—" },
    { field: "role", headerName: "Função", width: 140 },
    {
      field: "status",
      headerName: "Status",
      width: 110,
      renderCell: (params: GridRenderCellParams<Employee, string>) => (
        <Button
          className="pointer-events-none self-center"
          size="small"
          color={params.value === "ACTIVE" ? "success" : "grey"}
          variant="pastel"
        >
          {STATUS_LABEL[params.value ?? ""] ?? params.value}
        </Button>
      ),
    },
    {
      field: "unitId",
      headerName: "Unidade",
      width: 140,
      valueGetter: (_, row) => locations.find((l) => l.id === row.unitId)?.name ?? row.unitId,
    },
    {
      field: "id",
      headerName: "Ações",
      width: 180,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<Employee, string>) => {
        const emp = params.row;
        return (
          <Box
          className="flex gap-2"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
            <Button size="small" variant="contained" color="primary" onClick={() => startEdit(emp)}>
              Editar
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<NiCross size="small" />}
              onClick={() => handleDelete(emp)}
            >
              Deletar
            </Button>
          </Box>
        );
      },
    },
  ];
}
