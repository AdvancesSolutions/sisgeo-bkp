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
import type { Material, MaterialComment } from "@sigeo/shared";
import { MessageSquare } from "lucide-react";

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

  const [commentsMaterial, setCommentsMaterial] = useState<Material | null>(null);
  const [comments, setComments] = useState<MaterialComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [savingComment, setSavingComment] = useState(false);

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
        setSuccess("Material cadastrado.");
      }
      closeModal();
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

  const openComments = async (m: Material) => {
    setCommentsMaterial(m);
    setComments([]);
    setNewComment("");
    setLoadingComments(true);
    try {
      const res = await api.get<MaterialComment[]>(`/materials/${m.id}/comments`);
      setComments(Array.isArray(res.data) ? res.data : []);
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Erro ao carregar comentários"));
    } finally {
      setLoadingComments(false);
    }
  };

  const closeComments = () => {
    setCommentsMaterial(null);
    setComments([]);
    setNewComment("");
  };

  const submitComment = async () => {
    if (!commentsMaterial || !newComment.trim()) return;
    setSavingComment(true);
    try {
      setError(null);
      await api.post(`/materials/${commentsMaterial.id}/comments`, { body: newComment.trim() });
      setNewComment("");
      const res = await api.get<MaterialComment[]>(`/materials/${commentsMaterial.id}/comments`);
      setComments(Array.isArray(res.data) ? res.data : []);
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Erro ao enviar comentário"));
    } finally {
      setSavingComment(false);
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
          {editingId ? "Editar material" : "Novo material"}
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
              label="Unidade (un, kg, L)"
              size="small"
              required
              fullWidth
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
            />
            <TextField
              type="number"
              label="Estoque"
              size="small"
              fullWidth
              value={form.stock}
              onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
              slotProps={{ htmlInput: { min: 0 } }}
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

      <Dialog open={!!commentsMaterial} onClose={closeComments} maxWidth="sm" fullWidth>
        <DialogTitle className="border-grey-100 border-b py-4">
          Comentários sobre estoque
          {commentsMaterial && ` – ${commentsMaterial.name}`}
        </DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-6">
          {loadingComments ? (
            <Typography variant="body2" className="text-text-secondary">
              Carregando…
            </Typography>
          ) : (
            <>
              <Box className="flex flex-col gap-2">
                {comments.length === 0 ? (
                  <Typography variant="body2" className="text-text-secondary">
                    Nenhum comentário ainda. Seja o primeiro a comentar.
                  </Typography>
                ) : (
                  comments.map((c) => (
                    <Box
                      key={c.id}
                      className="rounded-lg border border-grey-100 bg-grey-50 p-3 dark:bg-grey-900/50"
                    >
                      <Typography variant="caption" className="text-text-secondary">
                        {c.userName ?? "Usuário"} ·{" "}
                        {c.createdAt
                          ? new Intl.DateTimeFormat("pt-BR", {
                              dateStyle: "short",
                              timeStyle: "short",
                            }).format(new Date(c.createdAt))
                          : ""}
                      </Typography>
                      <Typography variant="body2" className="mt-1 text-text-primary">
                        {c.body}
                      </Typography>
                    </Box>
                  ))
                )}
              </Box>
              <Box className="flex gap-2 border-t border-grey-100 pt-4">
                <TextField
                  label="Novo comentário"
                  size="small"
                  fullWidth
                  multiline
                  minRows={2}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Comente sobre o estoque deste material…"
                />
                <Button
                  variant="contained"
                  color="primary"
                  disabled={savingComment || !newComment.trim()}
                  onClick={submitComment}
                  sx={{ alignSelf: "flex-end" }}
                >
                  {savingComment ? "Enviando…" : "Enviar"}
                </Button>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button variant="outlined" onClick={closeComments}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          <Box className="min-h-64">
            <DataGrid
              rows={materials}
              columns={materialColumns(startEdit, handleDelete, openComments)}
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
  openComments: (m: Material) => void,
): GridColDef<Material>[] {
  return [
    { field: "name", headerName: "Nome", flex: 1, minWidth: 160 },
    { field: "unit", headerName: "Unidade", width: 100 },
    { field: "stock", headerName: "Estoque", width: 100, type: "number" },
    {
      field: "id",
      headerName: "Ações",
      width: 260,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<Material, string>) => {
        const m = params.row;
        return (
          <Box
            className="flex gap-2"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Button size="small" variant="contained" color="primary" onClick={() => startEdit(m)}>
              Editar
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="info"
              startIcon={<MessageSquare className="h-4 w-4" />}
              onClick={() => openComments(m)}
            >
              Comentários
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
