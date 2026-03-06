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
import type { Area, Location } from "@sigeo/shared";

const RISK_OPTIONS = [
  { value: "CRITICO", label: "Crítico" },
  { value: "SEMICRITICO", label: "Semicrítico" },
  { value: "NAO_CRITICO", label: "Não crítico" },
] as const;

const emptyForm = { locationId: "", name: "", riskClassification: "" as string, cleaningFrequency: "" };

export function Areas() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<{
    locationId: string;
    name: string;
    riskClassification: string;
    cleaningFrequency: string;
  }>(emptyForm);

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
      const payload = {
        name: form.name.trim(),
        riskClassification: form.riskClassification || null,
        cleaningFrequency: form.cleaningFrequency.trim() || null,
      };
      if (editingId) {
        await api.patch(`/areas/${editingId}`, payload);
        setSuccess("Área atualizada.");
      } else {
        await api.post("/areas", {
          locationId: form.locationId,
          ...payload,
        });
        setSuccess("Área cadastrada.");
      }
      closeModal();
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
    setForm({
      locationId: area.locationId,
      name: area.name,
      riskClassification: area.riskClassification ?? "",
      cleaningFrequency: area.cleaningFrequency ?? "",
    });
    setShowForm(true);
  };

  const openNew = () => {
    setEditingId(null);
    setForm({ ...emptyForm, locationId: locations[0]?.id ?? "" });
    setShowForm(true);
  };

  const closeModal = () => {
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
          onClick={openNew}
        >
          Nova
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
          {editingId ? "Editar área" : "Nova área"}
        </DialogTitle>
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <DialogContent className="flex flex-col gap-4 pt-6">
            <FormControl
              variant="outlined"
              size="small"
              required={!editingId}
              disabled={!!editingId}
              fullWidth
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
              fullWidth
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <FormControl variant="outlined" size="small" fullWidth>
              <InputLabel>Classificação de risco</InputLabel>
              <Select
                value={form.riskClassification}
                onChange={(e) => setForm((f) => ({ ...f, riskClassification: e.target.value }))}
                label="Classificação de risco"
                IconComponent={NiChevronDownSmall}
                MenuProps={{ className: "outlined" }}
              >
                <MenuItem value="">Nenhuma</MenuItem>
                {RISK_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Frequência de limpeza"
              size="small"
              fullWidth
              placeholder="Ex: diária, 2x/dia, semanal"
              value={form.cleaningFrequency}
              onChange={(e) => setForm((f) => ({ ...f, cleaningFrequency: e.target.value }))}
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
              rows={areas}
              columns={areaColumns(locations, startEdit, handleDelete)}
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
      field: "riskClassification",
      headerName: "Risco",
      width: 120,
      valueGetter: (_, row) => {
        const v = row.riskClassification;
        return v ? RISK_OPTIONS.find((o) => o.value === v)?.label ?? v : "—";
      },
    },
    {
      field: "cleaningFrequency",
      headerName: "Frequência",
      width: 140,
      valueGetter: (_, row) => row.cleaningFrequency ?? "—",
    },
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
          <Box
          className="flex gap-2"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
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
