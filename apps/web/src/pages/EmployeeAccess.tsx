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
  TextField,
  Typography,
} from "@mui/material";
import { type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";

import NiArrowDown from "@/icons/nexture/ni-arrow-down";
import NiArrowUp from "@/icons/nexture/ni-arrow-up";
import NiKey from "@/icons/nexture/ni-key";
import NiPlus from "@/icons/nexture/ni-plus";
import NiCross from "@/icons/nexture/ni-cross";
import { dataGridLocalePtBR } from "@/lib/data-grid-locale";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";

interface EmployeeAccessItem {
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  unitId: string;
  unitName?: string;
  hasAccess: boolean;
  userId?: string;
  email?: string;
}

type ModalMode = "create" | "reset" | null;

export function EmployeeAccess() {
  const [items, setItems] = useState<EmployeeAccessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedItem, setSelectedItem] = useState<EmployeeAccessItem | null>(null);
  const [form, setForm] = useState({ email: "", password: "" });

  const load = async () => {
    try {
      setError(null);
      const res = await api.get<{ data: EmployeeAccessItem[] }>("/employee-access");
      setItems(res.data.data ?? []);
    } catch (e: unknown) {
      setSuccess(null);
      setError(getApiErrorMessage(e, "Erro ao carregar acessos"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = (item: EmployeeAccessItem) => {
    setSelectedItem(item);
    setForm({ email: "", password: "" });
    setModalMode("create");
  };

  const openReset = (item: EmployeeAccessItem) => {
    setSelectedItem(item);
    setForm({ email: item.email ?? "", password: "" });
    setModalMode("reset");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedItem(null);
    setForm({ email: "", password: "" });
  };

  const handleCreate = async () => {
    if (!selectedItem || !form.email.trim() || !form.password.trim()) {
      setError("Preencha e-mail e senha.");
      return;
    }
    if (form.password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await api.post("/employee-access", {
        employeeId: selectedItem.employeeId,
        email: form.email.trim(),
        password: form.password,
      });
      setSuccess("Acesso criado. O funcionário já pode fazer login no app.");
      closeModal();
      await load();
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Erro ao criar acesso"));
      setSuccess(null);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!selectedItem || !form.password.trim()) {
      setError("Preencha a nova senha.");
      return;
    }
    if (form.password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await api.patch(`/employee-access/${selectedItem.employeeId}/password`, {
        password: form.password,
      });
      setSuccess("Senha redefinida com sucesso.");
      closeModal();
      await load();
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Erro ao redefinir senha"));
      setSuccess(null);
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (item: EmployeeAccessItem) => {
    if (
      !window.confirm(
        `Revogar acesso de "${item.employeeName}"? O funcionário não poderá mais fazer login no app.`,
      )
    )
      return;
    try {
      setError(null);
      setSuccess(null);
      await api.delete(`/employee-access/${item.employeeId}`);
      setSuccess("Acesso revogado.");
      await load();
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Erro ao revogar acesso"));
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
      <Box className="mb-4">
        <Typography variant="h6" component="h1" className="text-text-primary">
          Acessos dos Funcionários
        </Typography>
        <Typography variant="body2" className="mt-1 text-text-secondary">
          Gerencie os acessos ao app mobile. Funcionários com acesso podem fazer login com e-mail e senha.
        </Typography>
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

      <Dialog open={modalMode !== null} onClose={closeModal} maxWidth="sm" fullWidth>
        <DialogTitle className="border-grey-100 border-b py-4">
          {modalMode === "create"
            ? `Criar acesso: ${selectedItem?.employeeName ?? ""}`
            : `Redefinir senha: ${selectedItem?.employeeName ?? ""}`}
        </DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-6">
          {modalMode === "create" && (
            <TextField
              label="E-mail"
              type="email"
              size="small"
              required
              fullWidth
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="exemplo@empresa.com"
            />
          )}
          {modalMode === "reset" && (
            <Typography variant="body2" className="text-text-secondary">
              E-mail atual: <strong>{selectedItem?.email}</strong>
            </Typography>
          )}
          <TextField
            label={modalMode === "create" ? "Senha inicial" : "Nova senha"}
            type="password"
            size="small"
            required
            fullWidth
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            helperText="Mínimo 6 caracteres"
          />
        </DialogContent>
        <DialogActions className="gap-2 px-6 pb-4">
          <Button variant="outlined" onClick={closeModal}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            disabled={saving}
            onClick={modalMode === "create" ? handleCreate : handleReset}
          >
            {saving ? "Salvando…" : modalMode === "create" ? "Criar acesso" : "Redefinir senha"}
          </Button>
        </DialogActions>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          <Box className="min-h-64">
            <DataGrid
              rows={items}
              columns={accessColumns(openCreate, openReset, handleRevoke)}
              localeText={dataGridLocalePtBR}
              initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
              pageSizeOptions={[10, 25, 50, 100]}
              disableColumnFilter
              disableColumnSelector
              disableDensitySelector
              columnHeaderHeight={40}
              disableRowSelectionOnClick
              className="border-none"
              getRowId={(row) => row.employeeId}
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

function accessColumns(
  openCreate: (item: EmployeeAccessItem) => void,
  openReset: (item: EmployeeAccessItem) => void,
  handleRevoke: (item: EmployeeAccessItem) => void,
): GridColDef<EmployeeAccessItem>[] {
  return [
    { field: "employeeName", headerName: "Funcionário", flex: 1, minWidth: 160 },
    { field: "employeeRole", headerName: "Função", width: 120 },
    {
      field: "unitName",
      headerName: "Unidade",
      width: 140,
      valueGetter: (_, row) => row.unitName ?? "—",
    },
    {
      field: "hasAccess",
      headerName: "Status",
      width: 120,
      renderCell: (params: GridRenderCellParams<EmployeeAccessItem, boolean>) => (
        <Button
          className="pointer-events-none self-center"
          size="small"
          color={params.value ? "success" : "grey"}
          variant="pastel"
        >
          {params.value ? "Com acesso" : "Sem acesso"}
        </Button>
      ),
    },
    {
      field: "email",
      headerName: "E-mail",
      width: 200,
      valueGetter: (_, row) => row.email ?? "—",
    },
    {
      field: "actions",
      headerName: "Ações",
      width: 220,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<EmployeeAccessItem>) => {
        const item = params.row;
        return (
          <Box
            className="flex gap-2"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {item.hasAccess ? (
              <>
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  startIcon={<NiKey size="small" />}
                  onClick={() => openReset(item)}
                >
                  Redefinir senha
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<NiCross size="small" />}
                  onClick={() => handleRevoke(item)}
                >
                  Revogar
                </Button>
              </>
            ) : (
              <Button
                size="small"
                variant="contained"
                color="primary"
                startIcon={<NiPlus size="small" />}
                onClick={() => openCreate(item)}
              >
                Criar acesso
              </Button>
            )}
          </Box>
        );
      },
    },
  ];
}
