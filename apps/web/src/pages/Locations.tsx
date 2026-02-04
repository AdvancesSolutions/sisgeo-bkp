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
import type { Location } from "@sigeo/shared";

const emptyForm = { name: "", address: "" };

export function Locations() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    try {
      setError(null);
      const res = await api.get<{ data: Location[] }>("/locations");
      setLocations(res.data.data ?? []);
    } catch (e: unknown) {
      setSuccess(null);
      setError(getApiErrorMessage(e, "Erro ao carregar locais"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!form.name.trim() || !form.address.trim()) {
      setError("Preencha Nome e Endereço.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const payload = { name: form.name.trim(), address: form.address.trim() };
      if (editingId) {
        await api.patch(`/locations/${editingId}`, payload);
        setSuccess("Unidade atualizada.");
      } else {
        await api.post("/locations", payload);
        setForm(emptyForm);
        setShowForm(false);
        setSuccess("Unidade criada.");
      }
      setEditingId(null);
      await load();
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Erro ao salvar unidade"));
      setSuccess(null);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (loc: Location) => {
    setEditingId(loc.id);
    setForm({ name: loc.name, address: loc.address });
    setShowForm(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
  };

  const handleDelete = async (loc: Location) => {
    if (!window.confirm(`Excluir a unidade "${loc.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      setError(null);
      setSuccess(null);
      await api.delete(`/locations/${loc.id}`);
      setSuccess("Unidade excluída.");
      await load();
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Erro ao excluir unidade"));
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
          Locais / Unidades
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
              {editingId ? "Editar local" : "Novo local"}
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
                label="Endereço"
                size="small"
                required
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className="min-w-64"
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
              rows={locations}
              columns={locationColumns(startEdit, handleDelete)}
              hideFooter={locations.length <= 100}
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
                      Nenhuma unidade cadastrada.
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

function locationColumns(
  startEdit: (loc: Location) => void,
  handleDelete: (loc: Location) => void,
): GridColDef<Location>[] {
  return [
    { field: "name", headerName: "Nome", flex: 1, minWidth: 160 },
    { field: "address", headerName: "Endereço", flex: 1, minWidth: 200 },
    {
      field: "id",
      headerName: "Ações",
      width: 180,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<Location, string>) => {
        const loc = params.row;
        return (
          <Box className="flex gap-2">
            <Button size="small" variant="contained" color="primary" onClick={() => startEdit(loc)}>
              Editar
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<NiCross size="small" />}
              onClick={() => handleDelete(loc)}
            >
              Deletar
            </Button>
          </Box>
        );
      },
    },
  ];
}
