import { useEffect, useState } from "react";

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
import NiChevronDownSmall from "@/icons/nexture/ni-chevron-down-small";
import NiCross from "@/icons/nexture/ni-cross";
import NiPlus from "@/icons/nexture/ni-plus";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import type { Area, Location } from "@sigeo/shared";

const emptyForm = { locationId: "", name: "" };

export function Areas() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<{ locationId: string; name: string }>(emptyForm);

  const load = async () => {
    try {
      setError(null);
      const [areasRes, locsRes] = await Promise.all([
        api.get<{ data: Area[] }>("/areas"),
        api.get<{ data: Location[] }>("/locations"),
      ]);
      const locs = locsRes.data.data ?? [];
      setAreas(areasRes.data.data ?? []);
      setLocations(locs);
      if (locs.length > 0 && !form.locationId) {
        setForm((f) => ({ ...f, locationId: locs[0].id }));
      }
    } catch (e: unknown) {
      setSuccess(null);
      setError(getApiErrorMessage(e, "Erro ao carregar áreas"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!form.name.trim()) {
      setError("Preencha o nome da área.");
      return;
    }
    if (!editingId && !form.locationId) {
      setError("Selecione um local.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      if (editingId) {
        await api.patch(`/areas/${editingId}`, { name: form.name.trim() });
        setSuccess("Área atualizada.");
      } else {
        await api.post("/areas", {
          locationId: form.locationId,
          name: form.name.trim(),
        });
        setForm((f) => ({ ...emptyForm, locationId: f.locationId }));
        setShowForm(false);
        setSuccess("Área cadastrada.");
      }
      setEditingId(null);
      await load();
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Erro ao salvar área"));
      setSuccess(null);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (area: Area) => {
    setEditingId(area.id);
    setForm({ locationId: area.locationId, name: area.name });
    setShowForm(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm((f) => ({ ...emptyForm, locationId: f.locationId }));
    setShowForm(false);
  };

  const handleDelete = async (area: Area) => {
    if (!window.confirm(`Excluir a área "${area.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      setError(null);
      setSuccess(null);
      await api.delete(`/areas/${area.id}`);
      setSuccess("Área excluída.");
      await load();
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Erro ao excluir área"));
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
          Áreas
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="medium"
          startIcon={<NiPlus size="medium" />}
          onClick={() => (editingId ? cancelEdit() : setShowForm(!showForm))}
        >
          {showForm || editingId ? "Cancelar" : "Nova"}
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
              {editingId ? "Editar área" : "Nova área"}
            </Typography>
            <Box
              component="form"
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
              className="flex flex-wrap gap-4"
            >
              <FormControl
                variant="outlined"
                size="small"
                required={!editingId}
                disabled={!!editingId}
                className="min-w-48"
              >
                <InputLabel>Local</InputLabel>
                <Select
                  value={form.locationId}
                  onChange={(e) => setForm((f) => ({ ...f, locationId: e.target.value }))}
                  label="Local"
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
              <TextField
                label="Nome da área"
                size="small"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="min-w-48"
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
              rows={areas}
              columns={areaColumns(locations, startEdit, handleDelete)}
              hideFooter={areas.length <= 100}
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
                      Nenhuma área cadastrada.
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

function areaColumns(
  locations: Location[],
  startEdit: (area: Area) => void,
  handleDelete: (area: Area) => void,
): GridColDef<Area>[] {
  return [
    { field: "name", headerName: "Nome", flex: 1, minWidth: 160 },
    {
      field: "locationId",
      headerName: "Local",
      width: 160,
      valueGetter: (_, row) => locations.find((l) => l.id === row.locationId)?.name ?? row.locationId,
    },
    {
      field: "id",
      headerName: "Ações",
      width: 180,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<Area, string>) => {
        const area = params.row;
        return (
          <Box className="flex gap-2">
            <Button size="small" variant="contained" color="primary" onClick={() => startEdit(area)}>
              Editar
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<NiCross size="small" />}
              onClick={() => handleDelete(area)}
            >
              Deletar
            </Button>
          </Box>
        );
      },
    },
  ];
}
