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
import { type GridColDef } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import NiPlus from "@/icons/nexture/ni-plus";
import { dataGridLocalePtBR } from "@/lib/data-grid-locale";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";

interface Procedimento {
  id: string;
  areaId?: string | null;
  cleaningTypeId?: string | null;
  titulo: string;
  videoUrlS3: string | null;
  manualPdfUrl: string | null;
  thumbnailUrl: string | null;
  duracaoSegundos?: number | null;
}

interface Area {
  id: string;
  name: string;
}

interface CleaningType {
  id: string;
  name: string;
}

type FormState = { areaId: string; cleaningTypeId: string; titulo: string };
const emptyForm: FormState = { areaId: "", cleaningTypeId: "", titulo: "" };

export function Procedimentos() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [items, setItems] = useState<Procedimento[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [cleaningTypes, setCleaningTypes] = useState<CleaningType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [uploading, setUploading] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const [procRes, areasRes, ctRes] = await Promise.all([
        api.get<Procedimento[]>("/procedimentos"),
        api.get<Area[] | { data: Area[] }>("/areas").then((r) => (Array.isArray(r.data) ? r.data : (r.data as { data: Area[] })?.data ?? [])),
        api.get<CleaningType[] | { data: CleaningType[] }>("/cleaning-types").then((r) => (Array.isArray(r.data) ? r.data : (r.data as { data: CleaningType[] })?.data ?? [])),
      ]);
      setItems(Array.isArray(procRes.data) ? procRes.data : []);
      setAreas(areasRes);
      setCleaningTypes(ctRes);
    } catch (e: unknown) {
      setSuccess(null);
      setError(getApiErrorMessage(e, "Erro ao carregar procedimentos"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!form.titulo.trim()) {
      setError("Preencha o título.");
      return;
    }
    if (!form.areaId && !form.cleaningTypeId) {
      setError("Informe a área ou o tipo de limpeza.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const payload = {
        areaId: form.areaId || null,
        cleaningTypeId: form.cleaningTypeId || null,
        titulo: form.titulo.trim(),
      };
      if (editingId) {
        await api.patch(`/procedimentos/${editingId}`, payload);
        setSuccess("Procedimento atualizado.");
      } else {
        await api.post("/procedimentos", payload);
        setSuccess("Procedimento criado.");
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

  const handleUpload = async (id: string, type: "video" | "pdf" | "thumbnail", file: File) => {
    try {
      setUploading(`${id}-${type}`);
      setError(null);
      const fd = new FormData();
      fd.append("file", file);
      await api.post<{ url: string }>(`/procedimentos/${id}/upload/${type}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(`Arquivo enviado.`);
      await load();
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Erro ao enviar arquivo"));
    } finally {
      setUploading(null);
    }
  };

  const startEdit = (item: Procedimento) => {
    setEditingId(item.id);
    setForm({
      areaId: item.areaId ?? "",
      cleaningTypeId: item.cleaningTypeId ?? "",
      titulo: item.titulo,
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

  const handleDelete = async (item: Procedimento) => {
    if (!window.confirm(`Excluir o procedimento "${item.titulo}"?`)) return;
    try {
      setError(null);
      await api.delete(`/procedimentos/${item.id}`);
      setSuccess("Procedimento excluído.");
      await load();
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Erro ao excluir"));
    }
  };

  const columns: GridColDef[] = [
    { field: "titulo", headerName: "Título", flex: 1, minWidth: 200 },
    {
      field: "area",
      headerName: "Área",
      width: 150,
      valueGetter: (_, row) => areas.find((a) => a.id === row.areaId)?.name ?? "-",
    },
    {
      field: "cleaningType",
      headerName: "Tipo Limpeza",
      width: 150,
      valueGetter: (_, row) => cleaningTypes.find((c) => c.id === row.cleaningTypeId)?.name ?? "-",
    },
    {
      field: "videoUrlS3",
      headerName: "Vídeo",
      width: 100,
      renderCell: (params) => {
        const row = params.row as Procedimento;
        if (!row.videoUrlS3) {
          return (
            <Button
              size="small"
              variant="outlined"
              component="label"
              disabled={!!uploading}
            >
              Enviar
              <input
                type="file"
                hidden
                accept="video/mp4,video/webm"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(row.id, "video", f);
                }}
              />
            </Button>
          );
        }
        return <Typography variant="body2" color="success.main">✓</Typography>;
      },
    },
    {
      field: "manualPdfUrl",
      headerName: "Manual",
      width: 100,
      renderCell: (params) => {
        const row = params.row as Procedimento;
        if (!row.manualPdfUrl) {
          return (
            <Button size="small" variant="outlined" component="label" disabled={!!uploading}>
              Enviar
              <input
                type="file"
                hidden
                accept="application/pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(row.id, "pdf", f);
                }}
              />
            </Button>
          );
        }
        return <Typography variant="body2" color="success.main">✓</Typography>;
      },
    },
    {
      field: "actions",
      headerName: "Ações",
      width: 120,
      renderCell: (params) => {
        const row = params.row as Procedimento;
        return (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button size="small" onClick={() => startEdit(row)}>Editar</Button>
            <Button size="small" color="error" onClick={() => handleDelete(row)}>Excluir</Button>
          </Box>
        );
      },
    },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h5">Treinamentos Just-in-Time</Typography>
            <Button variant="contained" startIcon={<NiPlus />} onClick={openNew}>
              Novo procedimento
            </Button>
          </Box>
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}
          {loading ? (
            <Typography>Carregando...</Typography>
          ) : (
            <DataGrid
              rows={items}
              columns={columns}
              getRowId={(r) => r.id}
              localeText={dataGridLocalePtBR}
              autoHeight
              disableRowSelectionOnClick
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onClose={closeModal} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? "Editar procedimento" : "Novo procedimento"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField
              label="Título"
              value={form.titulo}
              onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Área</InputLabel>
              <Select
                value={form.areaId}
                label="Área"
                onChange={(e) => setForm((f) => ({ ...f, areaId: e.target.value }))}
              >
                <MenuItem value="">Nenhuma</MenuItem>
                {areas.map((a) => (
                  <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Tipo de Limpeza</InputLabel>
              <Select
                value={form.cleaningTypeId}
                label="Tipo de Limpeza"
                onChange={(e) => setForm((f) => ({ ...f, cleaningTypeId: e.target.value }))}
              >
                <MenuItem value="">Nenhum</MenuItem>
                {cleaningTypes.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModal}>Cancelar</Button>
          <Button variant="contained" onClick={save} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
