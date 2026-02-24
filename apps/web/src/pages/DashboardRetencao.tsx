import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";

import api from "@/lib/api";
import type { Location } from "@sigeo/shared";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { type Dayjs } from "dayjs";

import NiChartBar from "@/icons/nexture/ni-chart-bar";
import NiExclamationSquare from "@/icons/nexture/ni-exclamation-square";
import NiTrophy from "@/icons/nexture/ni-trophy";

export interface RiscoColaboradorRow {
  id: string;
  employeeId: string;
  employeeName: string;
  score: number;
  nivel: string;
  motivos: string[];
  acoesSugeridas: string[];
  detalhes: Record<string, unknown>;
}

export interface RoiEconomia {
  turnoverEvitado: number;
  custoMedioContratacao: number;
  colaboradoresEmRisco: number;
  economiaEstimada: number;
}

export function DashboardRetencao() {
  const [referenceDate, setReferenceDate] = useState<Dayjs>(dayjs());
  const [locationId, setLocationId] = useState<string>("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [riscos, setRiscos] = useState<RiscoColaboradorRow[]>([]);
  const [roi, setRoi] = useState<RoiEconomia | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const refStr = referenceDate.format("YYYY-MM-DD");
      const params = new URLSearchParams({ referenceDate: refStr });
      if (locationId) params.set("locationId", locationId);

      const roiParams = locationId ? `locationId=${locationId}` : "";
      const [riscosRes, roiRes] = await Promise.all([
        api.get<RiscoColaboradorRow[]>(`/risco-colaborador?${params}`),
        api.get<RoiEconomia>(`/risco-colaborador/roi?${roiParams}`),
      ]);

      setRiscos(Array.isArray(riscosRes.data) ? riscosRes.data : []);
      setRoi(roiRes.data ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar dados");
      setRiscos([]);
      setRoi(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get<{ data: Location[] }>("/locations").then(({ data }) => setLocations(data.data ?? []));
  }, []);

  useEffect(() => {
    loadData();
  }, [referenceDate, locationId]);

  const riscosAltos = riscos.filter((r) => r.nivel === "ALTO");

  const getNivelColor = (nivel: string) => {
    if (nivel === "ALTO") return "error";
    if (nivel === "MEDIO") return "warning";
    return "success";
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-BR">
      <Grid container spacing={3}>
        <Grid container spacing={2} className="w-full" size={12}>
          <Grid size={{ xs: 12, md: "grow" }}>
            <Typography variant="h1" component="h1" className="mb-0">
              Dashboard de Retenção (RH-SIGHT)
            </Typography>
            <Breadcrumbs>
              <Link color="inherit" to="/dashboard">
                Início
              </Link>
              <Link color="inherit" to="/painel-controle">
                Administração
              </Link>
              <Typography variant="body2">Retenção</Typography>
            </Breadcrumbs>
          </Grid>

          <Grid size={{ xs: 12, md: "auto" }} className="flex flex-row flex-wrap items-start gap-2">
            <FormControl size="small" variant="outlined" sx={{ minWidth: 160 }}>
              <InputLabel>Unidade</InputLabel>
              <Select
                value={locationId}
                label="Unidade"
                onChange={(e) => setLocationId(e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                {locations.map((loc) => (
                  <MenuItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <DatePicker
              label="Data de referência"
              value={referenceDate}
              onChange={(d) => d && setReferenceDate(d)}
              slotProps={{
                textField: { size: "small", sx: { minWidth: 160 } },
                actionBar: { actions: ["today"] },
              }}
            />
          </Grid>
        </Grid>

        {error && (
          <Grid size={12}>
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Grid>
        )}

        {/* Cards de ROI */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card className="bg-primary-light/10 border-0 shadow-none">
            <CardContent className="flex flex-col gap-1">
              {loading ? (
                <Skeleton variant="text" width="60%" height={40} />
              ) : (
                <>
                  <Box className="flex items-end justify-between">
                    <Typography variant="h3" component="p" className="font-bold text-text-primary">
                      {roi?.economiaEstimada != null
                        ? roi.economiaEstimada.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })
                        : "—"}
                    </Typography>
                    <NiTrophy size={24} className="text-primary" />
                  </Box>
                  <Typography variant="body2" className="font-medium text-text-primary">
                    Economia Estimada (ROI)
                  </Typography>
                  <Typography variant="caption" className="text-text-secondary">
                    Custo de turnover evitado
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card className="bg-primary-light/10 border-0 shadow-none">
            <CardContent className="flex flex-col gap-1">
              {loading ? (
                <Skeleton variant="text" width="60%" height={40} />
              ) : (
                <>
                  <Box className="flex items-end justify-between">
                    <Typography variant="h3" component="p" className="font-bold text-text-primary">
                      {roi?.colaboradoresEmRisco ?? "—"}
                    </Typography>
                    <NiChartBar size={24} className="text-primary" />
                  </Box>
                  <Typography variant="body2" className="font-medium text-text-primary">
                    Em Risco (Médio/Alto)
                  </Typography>
                  <Typography variant="caption" className="text-text-secondary">
                    Colaboradores monitorados
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent className="flex flex-col gap-1">
              {loading ? (
                <Skeleton variant="text" width="60%" height={40} />
              ) : (
                <>
                  <Typography variant="body2" className="font-medium text-text-primary">
                    Turnover Evitado
                  </Typography>
                  <Typography variant="h5" component="p" className="font-bold text-text-primary">
                    {roi?.turnoverEvitado ?? "—"}
                  </Typography>
                  <Typography variant="caption" className="text-text-secondary">
                    Estimativa com ações de retenção
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent className="flex flex-col gap-1">
              {loading ? (
                <Skeleton variant="text" width="60%" height={40} />
              ) : (
                <>
                  <Typography variant="body2" className="font-medium text-text-primary">
                    Custo Médio por Desligamento
                  </Typography>
                  <Typography variant="h5" component="p" className="font-bold text-text-primary">
                    {roi?.custoMedioContratacao != null
                      ? roi.custoMedioContratacao.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })
                      : "—"}
                  </Typography>
                  <Typography variant="caption" className="text-text-secondary">
                    Recrutamento + onboarding
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Alertas críticos */}
        {riscosAltos.length > 0 && (
          <Grid size={12}>
            <Alert
              severity="error"
              icon={<NiExclamationSquare size={24} />}
              sx={{ "& .MuiAlert-message": { width: "100%" } }}
            >
              <Typography variant="subtitle2" className="font-semibold mb-1">
                {riscosAltos.length} colaborador(es) com risco ALTO de evasão
              </Typography>
              <Typography variant="body2">
                Priorize entrevistas de retenção e ações sugeridas para estes casos.
              </Typography>
            </Alert>
          </Grid>
        )}

        {/* Tabela de colaboradores em risco */}
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="mb-3 font-semibold">
                Painel de Alerta – Risco de Evasão
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={200} />
              ) : riscos.length === 0 ? (
                <Alert severity="info">
                  Nenhum colaborador com indicadores de risco na data selecionada.
                </Alert>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Colaborador</TableCell>
                        <TableCell align="center">Nível</TableCell>
                        <TableCell align="center">Score</TableCell>
                        <TableCell>Causa Raiz</TableCell>
                        <TableCell>Ações Sugeridas</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {riscos.map((r) => (
                        <TableRow key={r.id} hover>
                          <TableCell>
                            <Link
                              to={`/employees?highlight=${r.employeeId}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {r.employeeName}
                            </Link>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={r.nivel}
                              color={getNivelColor(r.nivel)}
                              size="small"
                              variant="filled"
                            />
                          </TableCell>
                          <TableCell align="center">{r.score}</TableCell>
                          <TableCell>
                            <Box className="flex flex-col gap-0.5">
                              {r.motivos?.length
                                ? r.motivos.map((m, i) => (
                                    <Typography key={i} variant="body2">
                                      • {m}
                                    </Typography>
                                  ))
                                : "—"}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box className="flex flex-wrap gap-1">
                              {r.acoesSugeridas?.map((a, i) => (
                                <Tooltip key={i} title="Agendar entrevista ou aplicar ação">
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                    sx={{ textTransform: "none" }}
                                  >
                                    {a}
                                  </Button>
                                </Tooltip>
                              ))}
                              {(!r.acoesSugeridas || r.acoesSugeridas.length === 0) && "—"}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </LocalizationProvider>
  );
}
