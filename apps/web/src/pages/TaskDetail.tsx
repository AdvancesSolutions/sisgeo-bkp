import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";

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

import NiArrowLeft from "@/icons/nexture/ni-arrow-left";
import NiCalendar from "@/icons/nexture/ni-calendar";
import NiCamera from "@/icons/nexture/ni-camera";
import NiCheckSquare from "@/icons/nexture/ni-check-square";
import NiCrossSquare from "@/icons/nexture/ni-cross-square";
import NiUser from "@/icons/nexture/ni-user";
import NiCells from "@/icons/nexture/ni-cells";
import NiMap from "@/icons/nexture/ni-map";
import NiArrowInDown from "@/icons/nexture/ni-arrow-in-down";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useAuth } from "@/contexts/AuthContext";

interface TaskPhoto {
  id: string;
  taskId: string;
  type: string;
  url: string;
  key: string;
  createdAt: string;
}

interface Task {
  id: string;
  areaId: string;
  area?: { name: string };
  employeeId: string | null;
  employee?: { name: string };
  scheduledDate: string;
  scheduledTime?: string | null;
  status: string;
  title: string | null;
  description: string | null;
  rejectedComment: string | null;
  rejectedAt: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  checkinLat?: number | null;
  checkinLng?: number | null;
  checkoutLat?: number | null;
  checkoutLng?: number | null;
  photos?: TaskPhoto[];
}

function TimelineItem({ label, value }: { label: string; value: string }) {
  return (
    <Box className="flex items-center gap-2">
      <Box className="h-2 w-2 shrink-0 rounded-full bg-primary" />
      <Typography variant="body2" className="text-text-secondary">
        {label}: <span className="text-text-primary">{value}</span>
      </Typography>
    </Box>
  );
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente",
  IN_PROGRESS: "Em execução",
  IN_REVIEW: "Em validação",
  DONE: "Concluída",
  REJECTED: "Rejeitada",
};

export function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (!id) return;
    setError(null);
    setTask(null);
    setLoading(true);
    api
      .get<Task>(`/tasks/${id}`)
      .then(({ data }) => {
        setTask(data);
        setError(null);
      })
      .catch((e: unknown) => setError(getApiErrorMessage(e, "Tarefa não encontrada")))
      .finally(() => setLoading(false));
  }, [id]);

  const handleExportPdf = async () => {
    if (!id) return;
    try {
      const { data } = await api.get(`/reports/visit/${id}/pdf`, { responseType: "blob" });
      const url = URL.createObjectURL(data as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-visita-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // erro tratado pelo interceptor
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    setActionLoading(true);
    setError(null);
    try {
      await api.post(`/tasks/${id}/approve`);
      setShowApproveModal(false);
      setTask((t) => (t ? { ...t, status: "DONE" } : null));
    } catch (e) {
      setError(getApiErrorMessage(e, "Falha ao aprovar"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!id || !rejectComment.trim()) return;
    setActionLoading(true);
    setError(null);
    try {
      const { data } = await api.post(`/tasks/${id}/reject`, {
        comment: rejectComment.trim(),
        reason: rejectReason || undefined,
      });
      setShowRejectModal(false);
      setRejectComment("");
      setRejectReason("");
      setTask(data);
    } catch (e) {
      setError(getApiErrorMessage(e, "Falha ao recusar"));
    } finally {
      setActionLoading(false);
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
  if (error || !task) {
    return (
      <Box>
        <Alert severity="error" className="mb-4" onClose={() => setError(null)}>
          {error}
        </Alert>
        <Button component={Link} to="/tasks" variant="outlined" color="primary" size="small">
          Voltar para tarefas
        </Button>
      </Box>
    );
  }

  const photosBefore = task.photos?.filter((p) => p.type === "BEFORE") ?? [];
  const photosAfter = task.photos?.filter((p) => p.type === "AFTER") ?? [];
  const canValidate = (user?.role === "ADMIN" || user?.role === "SUPERVISOR") && task.status === "IN_REVIEW";
  let baseUrl = import.meta.env.VITE_API_URL || "";
  if (typeof window !== "undefined" && window.location?.protocol === "https:" && baseUrl.startsWith("http://")) {
    baseUrl = baseUrl.replace(/^http:\/\//i, "https://");
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { dateStyle: "short" });
  const formatDateTime = (d: string) => new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  const scheduledLabel =
    task.scheduledTime != null && task.scheduledTime !== ""
      ? `${formatDate(task.scheduledDate)} às ${String(task.scheduledTime).slice(0, 5)}`
      : formatDate(task.scheduledDate);

  return (
    <Box>
      <Box className="mb-4 flex flex-row flex-wrap items-center gap-3">
        <Button
          component={Link}
          to="/tasks"
          variant="text"
          color="primary"
          size="small"
          startIcon={<NiArrowLeft size="small" className="rtl:rotate-180" />}
          className="text-text-secondary hover:text-primary"
        >
          Voltar
        </Button>
        <Typography variant="h6" component="h1" className="flex-1 text-text-primary">
          {task.title || "Tarefa sem título"}
        </Typography>
        <Box
          component="span"
          className="inline-flex items-center gap-1.5 rounded-md border border-grey-200 bg-grey-100 px-3 py-1.5 text-sm font-medium text-text-primary"
        >
          <NiCheckSquare size="small" className="text-text-secondary" />
          {STATUS_LABEL[task.status] ?? task.status}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" className="mb-4" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card elevation={0} className="border border-grey-100 bg-background-paper shadow-darker-xs">
          <CardContent className="flex flex-col gap-3">
            <Box className="flex items-center gap-2 text-text-secondary">
              <NiCalendar size="small" className="text-text-disabled" />
              <Typography variant="body2">
                Data agendada: <span className="text-text-primary">{scheduledLabel}</span>
              </Typography>
            </Box>
            <Box className="flex items-center gap-2 text-text-secondary">
              <NiCells size="small" className="text-text-disabled" />
              <Typography variant="body2">
                Área: <span className="text-text-primary">{task.area?.name ?? task.areaId}</span>
              </Typography>
            </Box>
            <Box className="flex items-center gap-2 text-text-secondary">
              <NiUser size="small" className="text-text-disabled" />
              <Typography variant="body2">
                Funcionário: <span className="text-text-primary">{task.employee?.name ?? task.employeeId ?? "—"}</span>
              </Typography>
            </Box>
            {task.description && (
              <Box className="border-t border-grey-100 pt-3">
                <Typography variant="body2" className="text-text-secondary">
                  {task.description}
                </Typography>
              </Box>
            )}
            {task.rejectedComment && (
              <Alert severity="warning" className="mt-2">
                <Typography variant="subtitle2" className="text-inherit">
                  Recusa anterior
                </Typography>
                <Typography variant="body2">{task.rejectedComment}</Typography>
                {task.rejectedAt && (
                  <Typography variant="caption" className="mt-1 block text-text-secondary">
                    {formatDateTime(task.rejectedAt)}
                  </Typography>
                )}
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card elevation={0} className="border border-grey-100 bg-background-paper shadow-darker-xs">
          <CardContent>
            <Typography variant="subtitle1" className="mb-3 flex items-center gap-2 font-semibold text-text-primary">
              <NiCamera size="small" />
              Fotos do serviço
            </Typography>
            <Box className="grid grid-cols-2 gap-4">
              <Box>
                <Typography variant="caption" className="mb-2 block text-text-secondary">
                  Antes
                </Typography>
                {photosBefore.length ? (
                  <Box className="flex flex-col gap-2">
                    {photosBefore.map((p) => (
                      <Box key={p.id}>
                        <a
                          href={p.url.startsWith("http") ? p.url : `${baseUrl}${p.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block overflow-hidden rounded-lg border border-grey-100"
                        >
                          <img
                            src={p.url.startsWith("http") ? p.url : `${baseUrl}${p.url}`}
                            alt="Antes"
                            className="h-32 w-full object-cover"
                          />
                        </a>
                        <Typography variant="caption" className="mt-1 block text-text-secondary">
                          {p.createdAt ? formatDateTime(p.createdAt) : ""}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box className="flex h-32 items-center justify-center rounded-lg border border-dashed border-grey-200">
                    <Typography variant="body2" className="text-text-disabled">
                      Nenhuma foto
                    </Typography>
                  </Box>
                )}
              </Box>
              <Box>
                <Typography variant="caption" className="mb-2 block text-text-secondary">
                  Depois
                </Typography>
                {photosAfter.length ? (
                  <Box className="flex flex-col gap-2">
                    {photosAfter.map((p) => (
                      <Box key={p.id}>
                        <a
                          href={p.url.startsWith("http") ? p.url : `${baseUrl}${p.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block overflow-hidden rounded-lg border border-grey-100"
                        >
                          <img
                            src={p.url.startsWith("http") ? p.url : `${baseUrl}${p.url}`}
                            alt="Depois"
                            className="h-32 w-full object-cover"
                          />
                        </a>
                        <Typography variant="caption" className="mt-1 block text-text-secondary">
                          {p.createdAt ? formatDateTime(p.createdAt) : ""}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box className="flex h-32 items-center justify-center rounded-lg border border-dashed border-grey-200">
                    <Typography variant="body2" className="text-text-disabled">
                      Nenhuma foto
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {(task.startedAt || task.checkinLat != null) && (
        <Card elevation={0} className="mt-4 border border-grey-100 bg-background-paper shadow-darker-xs">
          <CardContent>
            <Typography variant="subtitle1" className="mb-3 flex items-center gap-2 font-semibold text-text-primary">
              Linha do tempo
            </Typography>
            <Box className="flex flex-col gap-2">
              <TimelineItem label="Horário programado" value={scheduledLabel} />
              {task.startedAt && <TimelineItem label="Check-in real" value={formatDateTime(task.startedAt)} />}
              <TimelineItem label="Preenchimento" value={task.startedAt ? "Concluído" : "—"} />
              {task.completedAt && <TimelineItem label="Check-out" value={formatDateTime(task.completedAt)} />}
            </Box>
          </CardContent>
        </Card>
      )}

      {(task.checkinLat != null && task.checkinLng != null) && (
        <Card elevation={0} className="mt-4 border border-grey-100 bg-background-paper shadow-darker-xs">
          <CardContent>
            <Typography variant="subtitle1" className="mb-2 flex items-center gap-2 font-semibold text-text-primary">
              <NiMap size="small" />
              Geolocalização
            </Typography>
            <Typography variant="body2" className="mb-2 text-text-secondary">
              Check-in: {task.checkinLat?.toFixed(6)}, {task.checkinLng?.toFixed(6)}
            </Typography>
            <Button
              component="a"
              href={`https://www.openstreetmap.org/?mlat=${task.checkinLat}&mlon=${task.checkinLng}&zoom=17`}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              variant="outlined"
              startIcon={<NiMap size="small" />}
            >
              Ver no mapa
            </Button>
          </CardContent>
        </Card>
      )}

      <Box className="mt-4 flex flex-wrap gap-3">
        <Button
          variant="outlined"
          size="medium"
          startIcon={<NiArrowInDown size="small" />}
          onClick={handleExportPdf}
        >
          Exportar PDF (Evidências)
        </Button>
      </Box>

      {canValidate && (
        <Box className="mt-4 flex gap-3">
          <Button
            variant="contained"
            color="success"
            size="medium"
            startIcon={<NiCheckSquare size="small" />}
            onClick={() => setShowApproveModal(true)}
          >
            Aprovar
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="medium"
            startIcon={<NiCrossSquare size="small" />}
            onClick={() => setShowRejectModal(true)}
          >
            Recusar
          </Button>
        </Box>
      )}

      <Dialog
        open={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ elevation: 0, className: "border border-grey-100 bg-background-paper shadow-darker-xl" }}
      >
        <DialogTitle className="border-b border-grey-100 py-4 text-text-primary">
          Aprovar serviço?
        </DialogTitle>
        <DialogContent className="pt-4">
          <Typography variant="body2" className="text-text-secondary">
            O status da tarefa será alterado para <strong>Concluída (DONE)</strong>.
          </Typography>
        </DialogContent>
        <DialogActions className="gap-2 px-6 pb-4">
          <Button variant="outlined" onClick={() => setShowApproveModal(false)}>
            Cancelar
          </Button>
          <Button variant="contained" color="success" onClick={handleApprove} disabled={actionLoading}>
            {actionLoading ? "Aprovando…" : "Aprovar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ elevation: 0, className: "border border-grey-100 bg-background-paper shadow-darker-xl" }}
      >
        <DialogTitle className="border-b border-grey-100 py-4 text-text-primary">
          Recusar serviço
        </DialogTitle>
        <DialogContent className="flex flex-col gap-3 pt-4">
          <Typography variant="body2" className="text-text-secondary">
            A tarefa voltará para <strong>Em execução</strong>. O comentário é obrigatório.
          </Typography>
          <TextField
            label="Motivo da Não Conformidade (obrigatório)"
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            multiline
            minRows={3}
            fullWidth
            size="small"
          />
          <TextField
            label="Categoria (opcional)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            fullWidth
            size="small"
          />
        </DialogContent>
        <DialogActions className="gap-2 px-6 pb-4">
          <Button
            variant="outlined"
            onClick={() => {
              setShowRejectModal(false);
              setRejectComment("");
              setRejectReason("");
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={actionLoading || !rejectComment.trim()}
          >
            {actionLoading ? "Recusando…" : "Recusar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
