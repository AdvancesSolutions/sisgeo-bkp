import { useEffect, useState } from "react";

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
import NiCross from "@/icons/nexture/ni-cross";
import NiPlus from "@/icons/nexture/ni-plus";
import { dataGridLocalePtBR } from "@/lib/data-grid-locale";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import type { CleaningType } from "@sigeo/shared";

type FormState = { name: string; description: string; tempoEstimado: string };
const emptyForm: FormState = { name: "", description: "", tempoEstimado: "" };

export function CleaningTypes() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [items, setItems] = useState<CleaningType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const load = async () => {
    try {
      setError(null);
      const res = await api.get<CleaningType[] | { data: CleaningType[] }>("/cleaning-types");
      const data = Array.isArray(res.data) ? res.data : (res.data as { data: CleaningType[] }).data ?? [];
      setItems(data);
    } catch (e: unknown) {
      setSuccess(null);
      setError(getApiErrorMessage(e, "Erro ao carregar tipos de limpeza"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!form.name.trim()) {
      setError("Preencha o nome.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        tempoEstimado: form.tempoEstimado ? parseInt(form.tempoEstimado, 10) : null,
      };
      if (editingId) {
        await api.patch(`/cleaning-types/${editingId}`, payload);
        setSuccess("Tipo de limpeza atualizado.");
      } else {
        await api.post("/cleaning-types", payload);
        setSuccess("Tipo de limpeza cadastrado.");
      }
      closeModal();
      await load();
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Erro ao salvar"));
      setSuccess(null);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: CleaningType) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description ?? "",
      tempoEstimado: item.tempoEstimado != null ? String(item.tempoEstimado) : "",
    });
    setShowForm(true);
  };

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const closeModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
  };

  const handleDelete = async (item: CleaningType) => {
    if (!window.confirm(`Excluir o tipo "${item.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      setError(null);
      setSuccess(null);
      await api.delete(`/cleaning-types/${item.id}`);
      setSuccess("Tipo de limpeza excluído.");
      await load();
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Erro ao excluir"));
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
          Tipos de Limpeza
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
          {editingId ? "Editar tipo de limpeza" : "Novo tipo de limpeza"}
        </DialogTitle>
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
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
              label="Descrição"
              size="small"
              fullWidth
              multiline
              minRows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            <TextField
              label="Tempo estimado (min)"
              size="small"
              fullWidth
              type="number"
              inputProps={{ min: 0 }}
              placeholder="Ex: 30"
              value={form.tempoEstimado}
              onChange={(e) => setForm((f) => ({ ...f, tempoEstimado: e.target.value }))}
            />
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
              rows={items}
              columns={columns(startEdit, handleDelete)}
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
                      Nenhum tipo de limpeza cadastrado.
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

function columns(
  startEdit: (item: CleaningType) => void,
  handleDelete: (item: CleaningType) => void,
): GridColDef<CleaningType>[] {
  return [
    { field: "name", headerName: "Nome", flex: 1, minWidth: 160 },
    { field: "description", headerName: "Descrição", flex: 1, minWidth: 200 },
    {
      field: "tempoEstimado",
      headerName: "Tempo est. (min)",
      width: 120,
      valueGetter: (_, row) => row.tempoEstimado ?? "—",
    },
    {
      field: "id",
      headerName: "Ações",
      width: 180,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<CleaningType, string>) => {
        const item = params.row;
        return (
          <Box
            className="flex gap-2"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Button size="small" variant="contained" color="primary" onClick={() => startEdit(item)}>
              Editar
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<NiCross size="small" />}
              onClick={() => handleDelete(item)}
            >
              Deletar
            </Button>
          </Box>
        );
      },
    },
  ];
}
