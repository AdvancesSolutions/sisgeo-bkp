import dayjs from "dayjs";
import "dayjs/locale/pt";
import { useEffect, useState } from "react";

import { Box, Card, CardContent, Grid, Skeleton, Typography } from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";

import NiCheckSquare from "@/icons/nexture/ni-check-square";
import NiClock from "@/icons/nexture/ni-clock";
import NiExclamationSquare from "@/icons/nexture/ni-exclamation-square";
import NiCells from "@/icons/nexture/ni-cells";
import api from "@/lib/api";

interface Kpis {
  taxaConformidade: number;
  slaPontualidade: number;
  ocorrenciasAtivas: number;
  coberturaSetores: { limpos: number; pendentes: number; total: number };
}

export default function DashboardKpis() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = dayjs().format("YYYY-MM-DD");
    api
      .get<Kpis>(`/dashboard/kpis?date=${today}`)
      .then(({ data }) => setKpis(data))
      .catch(() => setKpis(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Grid container spacing={2.5}>
        {[1, 2, 3, 4].map((i) => (
          <Grid key={i} size={{ lg: 3, md: 6, xs: 12 }}>
            <Card>
              <CardContent>
                <Skeleton variant="text" width="60%" height={24} />
                <Skeleton variant="text" width="40%" height={40} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  const c = kpis ?? {
    taxaConformidade: 0,
    slaPontualidade: 0,
    ocorrenciasAtivas: 0,
    coberturaSetores: { limpos: 0, pendentes: 0, total: 0 },
  };

  const coberturaData = [
    { id: 0, value: c.coberturaSetores.limpos, label: "Limpos", color: "#22c55e" },
    { id: 1, value: c.coberturaSetores.pendentes, label: "Pendentes", color: "#f59e0b" },
  ].filter((d) => d.value > 0);

  return (
    <>
      <Typography variant="h6" component="h6" className="mt-2 mb-3">
        Indicadores do dia
      </Typography>
      <Grid container spacing={2.5}>
        <Grid size={{ lg: 3, md: 6, xs: 12 }}>
          <Card className="h-full">
            <CardContent className="flex flex-col gap-2">
              <Box className="flex items-center gap-2 text-text-secondary">
                <NiCheckSquare size="small" className="text-success" />
                <Typography variant="body2">Taxa de Conformidade</Typography>
              </Box>
              <Typography variant="h4" className="font-semibold text-text-primary">
                {c.taxaConformidade}%
              </Typography>
              <Typography variant="caption" className="text-text-secondary">
                Checklists aprovados vs. reprovados
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ lg: 3, md: 6, xs: 12 }}>
          <Card className="h-full">
            <CardContent className="flex flex-col gap-2">
              <Box className="flex items-center gap-2 text-text-secondary">
                <NiClock size="small" className="text-primary" />
                <Typography variant="body2">SLA de Pontualidade</Typography>
              </Box>
              <Typography variant="h4" className="font-semibold text-text-primary">
                {c.slaPontualidade}%
              </Typography>
              <Typography variant="caption" className="text-text-secondary">
                Tarefas iniciadas em até 15 min
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ lg: 3, md: 6, xs: 12 }}>
          <Card className="h-full">
            <CardContent className="flex flex-col gap-2">
              <Box className="flex items-center gap-2 text-text-secondary">
                <NiExclamationSquare size="small" className="text-error" />
                <Typography variant="body2">Ocorrências Ativas</Typography>
              </Box>
              <Typography variant="h4" className="font-semibold text-text-primary">
                {c.ocorrenciasAtivas}
              </Typography>
              <Typography variant="caption" className="text-text-secondary">
                Incidentes não resolvidos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ lg: 3, md: 6, xs: 12 }}>
          <Card className="h-full">
            <CardContent className="flex flex-col gap-2">
              <Box className="flex items-center gap-2 text-text-secondary">
                <NiCells size="small" className="text-primary" />
                <Typography variant="body2">Cobertura de Setores</Typography>
              </Box>
              {coberturaData.length > 0 ? (
                <Box className="flex items-center gap-3">
                  <PieChart
                    series={[{ data: coberturaData, innerRadius: 20, outerRadius: 32 }]}
                    width={80}
                    height={80}
                    margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                  />
                  <Box>
                    <Typography variant="h6" className="font-semibold text-text-primary">
                      {c.coberturaSetores.limpos}/{c.coberturaSetores.total}
                    </Typography>
                    <Typography variant="caption" className="text-text-secondary">
                      Limpos vs. Pendentes
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Typography variant="h6" className="font-semibold text-text-primary">
                  0/{c.coberturaSetores.total}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
