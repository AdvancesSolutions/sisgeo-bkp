import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
} from "@mui/material";
import { type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";

import NiArrowDown from "@/icons/nexture/ni-arrow-down";
import NiArrowUp from "@/icons/nexture/ni-arrow-up";
import NiCross from "@/icons/nexture/ni-cross";
import NiPlus from "@/icons/nexture/ni-plus";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import type { Material } from "@sigeo/shared";

type MaterialFormState = { name: string; unit: string; stock: string };
const emptyForm: MaterialFormState = { name: "", unit: "", stock: "" };

export function Materials() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<MaterialFormState>(emptyForm);

  const load = async () => {
    try {
      setError(null);
      const res = await api.get<{ data: Material[] }>("/materials");
      setMaterials(res.data.data ?? []);
    } catch (e: unknown) {
      setSuccess(null);
      setError(getApiErrorMessage(e, "Erro ao carregar materiais"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!form.name.trim() || !form.unit.trim()) {
      setError("Preencha Nome e Unidade.");
      return;
    }
    const stockNum = form.stock.trim() ? Number(form.stock) : 0;
    if (Number.isNaN(stockNum) || stockNum < 0) {
      setError("Estoque deve ser um número maior ou igual a zero.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      if (editingId) {
        await api.patch(`/materials/${editingId}`, {
          name: form.name.trim(),
          unit: form.unit.trim(),
          stock: stockNum,
        });
        setSuccess("Material atualizado.");
      } else {
        await api.post("/materials", {
          name: form.name.trim(),
          unit: form.unit.trim(),
          stock: stockNum,
        });
        setForm(emptyForm);
        setShowForm(false);
        setSuccess("Material cadastrado.");
      }
      setEditingId(null);
      await load();
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Erro ao salvar material"));
      setSuccess(null);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (m: Material) => {
    setEditingId(m.id);
    setForm({ name: m.name, unit: m.unit, stock: String(m.stock) });
    setShowForm(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
  };

  const handleDelete = async (m: Material) => {
    if (!window.confirm(`Excluir o material "${m.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      setError(null);
      setSuccess(null);
      await api.delete(`/materials/${m.id}`);
      setSuccess("Material excluído.");
      await load();
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Erro ao excluir material"));
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
          Materiais / Estoque
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="medium"
          startIcon={<NiPlus size="medium" />}
          onClick={() => (editingId ? cancelEdit() : setShowForm(!showForm))}
        >
          {showForm || editingId ? "Cancelar" : "Novo"}
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

      {(showForm || editingId) && (
        <Card className="mb-4">
          <CardContent>
            <Typography variant="subtitle1" className="mb-3 font-semibold text-text-primary">
              {editingId ? "Editar material" : "Novo material"}
            </Typography>
            <Box
              component="form"
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
              className="flex flex-wrap gap-4"
            >
              <TextField
                label="Nome"
                size="small"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="min-w-48"
              />
              <TextField
                label="Unidade (un, kg, L)"
                size="small"
                required
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                className="min-w-40"
              />
              <TextField
                type="number"
                label="Estoque"
                size="small"
                value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                slotProps={{ htmlInput: { min: 0 } }}
                className="min-w-32"
              />
              <Button type="submit" variant="contained" color="primary" disabled={saving}>
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
              rows={materials}
              columns={materialColumns(startEdit, handleDelete)}
              hideFooter={materials.length <= 100}
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
                      Nenhum material cadastrado.
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

function materialColumns(
  startEdit: (m: Material) => void,
  handleDelete: (m: Material) => void,
): GridColDef<Material>[] {
  return [
    { field: "name", headerName: "Nome", flex: 1, minWidth: 160 },
    { field: "unit", headerName: "Unidade", width: 100 },
    { field: "stock", headerName: "Estoque", width: 100, type: "number" },
    {
      field: "id",
      headerName: "Ações",
      width: 180,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<Material, string>) => {
        const m = params.row;
        return (
          <Box className="flex gap-2">
            <Button size="small" variant="contained" color="primary" onClick={() => startEdit(m)}>
              Editar
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<NiCross size="small" />}
              onClick={() => handleDelete(m)}
            >
              Deletar
            </Button>
          </Box>
        );
      },
    },
  ];
}
