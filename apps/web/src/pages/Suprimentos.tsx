import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { BarChart, BarElement } from "@mui/x-charts";

import CustomChartTooltip from "@/components/charts/tooltip/custom-chart-tooltip";
import { withChartElementStyle } from "@/lib/chart-element-hoc";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import NiBasket from "@/icons/nexture/ni-basket";
import NiCheckSquare from "@/icons/nexture/ni-check-square";
import NiExclamationSquare from "@/icons/nexture/ni-exclamation-square";

type CustoPorSetor = { areaId: string; areaName: string; custoTotal: number };
type EstoqueCritico = {
  id: string;
  quantidade: number;
  insumo?: { nome: string; unidadeMedida: string; estoqueMinimo: number };
  area?: { name: string };
};
type PedidoCompra = {
  id: string;
  quantidade: number;
  status: string;
  precoTotal: number | null;
  insumo?: { nome: string };
  fornecedor?: { nome: string };
  area?: { name: string };
};

export function Suprimentos() {
  const theme = useTheme();
  const [custoPorSetor, setCustoPorSetor] = useState<CustoPorSetor[]>([]);
  const [estoquesCriticos, setEstoquesCriticos] = useState<EstoqueCritico[]>([]);
  const [pedidos, setPedidos] = useState<PedidoCompra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string>("");
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [recebendoId, setRecebendoId] = useState<string | null>(null);
  const [nfCodigo, setNfCodigo] = useState("");

  const load = async () => {
    try {
      setError(null);
      const [custoRes, criticosRes, pedidosRes, locsRes] = await Promise.all([
        api.get<CustoPorSetor[]>("/suprimentos/custo-por-setor", {
          params: locationId ? { locationId } : undefined,
        }),
        api.get<EstoqueCritico[]>("/suprimentos/estoques-criticos"),
        api.get<PedidoCompra[]>("/suprimentos/pedidos", {
          params: { status: "RASCUNHO" },
        }),
        api.get<{ data: { id: string; name: string }[] }>("/locations"),
      ]);
      setCustoPorSetor(Array.isArray(custoRes.data) ? custoRes.data : []);
      setEstoquesCriticos(Array.isArray(criticosRes.data) ? criticosRes.data : []);
      setPedidos(Array.isArray(pedidosRes.data) ? pedidosRes.data : []);
      setLocations(locsRes.data?.data ?? locsRes.data ?? []);
    } catch (e: unknown) {
      setSuccess(null);
      setError(getApiErrorMessage(e, "Erro ao carregar suprimentos"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [locationId]);

  const aprovar = async (id: string) => {
    try {
      setError(null);
      await api.patch(`/suprimentos/pedidos/${id}/aprovar`);
      setSuccess("Pedido aprovado com sucesso.");
      load();
    } catch (e: unknown) {
      setSuccess(null);
      setError(getApiErrorMessage(e, "Erro ao aprovar pedido"));
    }
  };

  const confirmarRecebimento = async (id: string) => {
    try {
      setError(null);
      await api.patch(`/suprimentos/pedidos/${id}/receber`, {
        nfCodigo: nfCodigo.trim() || undefined,
      });
      setSuccess("Recebimento confirmado. Estoque atualizado.");
      setRecebendoId(null);
      setNfCodigo("");
      load();
    } catch (e: unknown) {
      setSuccess(null);
      setError(getApiErrorMessage(e, "Erro ao confirmar recebimento"));
    } finally {
      setRecebendoId(null);
    }
  };

  const chartData = custoPorSetor.map((r) => ({
    area: r.areaName || "Sem nome",
    custo: r.custoTotal,
  }));

  if (loading) {
    return (
      <Box>
        <Typography variant="h1" className="mb-4">
          Suprimentos
        </Typography>
        <Skeleton variant="rectangular" height={320} className="mb-4" />
        <Skeleton variant="rectangular" height={200} />
      </Box>
    );
  }

  return (
    <Box>
      <Box className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <Box>
          <Typography variant="h1" component="h1" className="mb-0">
            Suprimentos
          </Typography>
          <Box sx={{ mt: 0.5 }}>
            <Link color="inherit" to="/dashboard">
              Início
            </Link>
            {" / "}
            <Typography variant="body2" component="span" color="text.secondary">
              Suprimentos
            </Typography>
          </Box>
        </Box>
        <FormControl size="small" variant="outlined" sx={{ minWidth: 180 }}>
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
      </Box>

      {(error || success) && (
        <Alert
          severity={error ? "error" : "success"}
          onClose={() => (error ? setError(null) : setSuccess(null))}
          className="mb-4"
        >
          {error ?? success}
        </Alert>
      )}

      <Box className="grid gap-6">
        {/* Gráfico Custo por Setor */}
        <Card>
          <CardContent>
            <Box className="mb-3 flex items-center gap-2">
              <NiBasket size="small" className="text-primary" />
              <Typography variant="h6">Custo de Insumos por Setor (últimos 30 dias)</Typography>
            </Box>
            {chartData.length > 0 ? (
              <BarChart
                xAxis={[
                  {
                    data: chartData.map((d) => d.area),
                    scaleType: "band",
                    categoryGapRatio: 0.5,
                    barGapRatio: 0.2,
                    disableLine: true,
                    disableTicks: true,
                  },
                ]}
                yAxis={[
                  {
                    disableLine: true,
                    disableTicks: true,
                    valueFormatter: (v: number | null) => {
                      if (typeof v !== "number") return "-";
                      return v >= 1000 ? `R$ ${(v / 1000).toFixed(1)}k` : `R$ ${v.toFixed(0)}`;
                    },
                  },
                ]}
                series={[
                  {
                    data: chartData.map((d) => d.custo),
                    color: theme.palette.primary.main,
                  },
                ]}
                height={300}
                slots={{
                  tooltip: CustomChartTooltip,
                  bar: withChartElementStyle(BarElement, { rx: 5, ry: 5 }),
                }}
                grid={{ horizontal: true }}
                margin={{ bottom: 60, left: 60 }}
              />
            ) : (
              <Typography color="text.secondary">
                Nenhum consumo registrado nos últimos 30 dias.
              </Typography>
            )}
          </CardContent>
        </Card>

        <Box className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Estoques Críticos */}
          <Card>
            <CardContent>
              <Box className="mb-3 flex items-center gap-2">
                <NiExclamationSquare size="small" className="text-error" />
                <Typography variant="h6">Estoques Críticos</Typography>
                {estoquesCriticos.length > 0 && (
                  <Chip
                    label={estoquesCriticos.length}
                    color="error"
                    size="small"
                  />
                )}
              </Box>
              {estoquesCriticos.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Insumo</TableCell>
                      <TableCell>Setor</TableCell>
                      <TableCell align="right">Atual</TableCell>
                      <TableCell align="right">Mínimo</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {estoquesCriticos.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>{e.insumo?.nome ?? "-"}</TableCell>
                        <TableCell>{e.area?.name ?? "-"}</TableCell>
                        <TableCell align="right">{e.quantidade}</TableCell>
                        <TableCell align="right">
                          {e.insumo?.estoqueMinimo ?? "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography color="text.secondary">
                  Nenhum estoque em nível crítico.
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Pedidos em Rascunho */}
          <Card>
            <CardContent>
              <Box className="mb-3 flex items-center gap-2">
                <NiCheckSquare size="small" className="text-warning" />
                <Typography variant="h6">Pedidos Aguardando Aprovação</Typography>
                {pedidos.length > 0 && (
                  <Chip label={pedidos.length} color="warning" size="small" />
                )}
              </Box>
              {pedidos.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Insumo</TableCell>
                      <TableCell>Qtd</TableCell>
                      <TableCell align="right">Valor</TableCell>
                      <TableCell align="right">Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pedidos.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          {p.insumo?.nome ?? "-"}
                          {p.area?.name && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              {p.area.name}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{p.quantidade}</TableCell>
                        <TableCell align="right">
                          {p.precoTotal != null
                            ? `R$ ${Number(p.precoTotal).toLocaleString("pt-BR")}`
                            : "-"}
                        </TableCell>
                        <TableCell align="right">
                          {recebendoId === p.id ? (
                            <Box className="flex items-center gap-1">
                              <TextField
                                size="small"
                                placeholder="NF"
                                value={nfCodigo}
                                onChange={(e) => setNfCodigo(e.target.value)}
                                sx={{ width: 80 }}
                              />
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => confirmarRecebimento(p.id)}
                              >
                                OK
                              </Button>
                              <Button
                                size="small"
                                onClick={() => {
                                  setRecebendoId(null);
                                  setNfCodigo("");
                                }}
                              >
                                Cancelar
                              </Button>
                            </Box>
                          ) : (
                            <Box className="flex gap-1">
                              <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                onClick={() => aprovar(p.id)}
                              >
                                Aprovar
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => setRecebendoId(p.id)}
                              >
                                Receber
                              </Button>
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography color="text.secondary">
                  Nenhum pedido aguardando aprovação.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
