import dayjs from "dayjs";
import "dayjs/locale/pt";
import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Typography,
} from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";

import api from "@/lib/api";

interface EvolutionPoint {
  date: string;
  score: number;
  pontualidade: number;
  conformidade: number;
  ocorrencias: number;
}

interface DashboardPerformanceEvolutionProps {
  startDate: dayjs.Dayjs;
  endDate: dayjs.Dayjs;
  organizationId?: string;
  locationId?: string;
}

export default function DashboardPerformanceEvolution({
  startDate,
  endDate,
  organizationId,
  locationId,
}: DashboardPerformanceEvolutionProps) {
  const [data, setData] = useState<EvolutionPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [granularity, setGranularity] = useState<"day" | "week" | "month">("day");

  const load = () => {
    const params: Record<string, string> = {
      from: startDate.format("YYYY-MM-DD"),
      to: endDate.format("YYYY-MM-DD"),
      granularity,
    };
    if (organizationId) params.organizationId = organizationId;
    if (locationId) params.locationId = locationId;

    setLoading(true);
    api
      .get<EvolutionPoint[]>("/dashboard/performance", { params })
      .then(({ data: res }) => setData(res))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  };

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const dates: string[] = [];
      let d = startDate;
      while (d.isBefore(endDate) || d.isSame(endDate)) {
        dates.push(d.format("YYYY-MM-DD"));
        d = d.add(1, "day");
      }
      for (const dateStr of dates) {
        const p: Record<string, string> = { date: dateStr };
        if (organizationId) p.organizationId = organizationId;
        if (locationId) p.locationId = locationId;
        await api.get("/dashboard/findme-score/calculate", { params: p });
      }
      load();
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    load();
  }, [startDate, endDate, granularity, organizationId, locationId]);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" className="mb-3">
            Evolução de Performance (FindMe Score)
          </Typography>
          <Skeleton variant="rectangular" height={280} />
        </CardContent>
      </Card>
    );
  }

  const xAxis = data.map((d) => d.date);
  const scoreData = data.map((d) => d.score);
  const pontualidadeData = data.map((d) => d.pontualidade);
  const conformidadeData = data.map((d) => d.conformidade);

  return (
    <Card>
      <CardContent>
        <Box className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <Typography variant="h6">Evolução de Performance (FindMe Score)</Typography>
          <Box className="flex items-center gap-2">
            <Button
              size="small"
              variant="outlined"
              onClick={handleCalculate}
              disabled={calculating}
            >
              {calculating ? "Calculando…" : "Calcular"}
            </Button>
            <FormControl size="small" variant="outlined" sx={{ minWidth: 120 }}>
            <InputLabel>Período</InputLabel>
            <Select
              value={granularity}
              label="Período"
              onChange={(e) => setGranularity(e.target.value as "day" | "week" | "month")}
            >
              <MenuItem value="day">Por dia</MenuItem>
              <MenuItem value="week">Por semana</MenuItem>
              <MenuItem value="month">Por mês</MenuItem>
            </Select>
          </FormControl>
          </Box>
        </Box>
        {data.length > 0 ? (
          <LineChart
            xAxis={[{ scaleType: "point", data: xAxis }]}
            series={[
              { data: scoreData, label: "Score Total", color: "#6366f1" },
              { data: pontualidadeData, label: "Pontualidade", color: "#22c55e" },
              { data: conformidadeData, label: "Conformidade", color: "#3b82f6" },
            ]}
            height={280}
            margin={{ top: 20, right: 30, bottom: 30, left: 50 }}
          />
        ) : (
          <Box className="flex h-[280px] items-center justify-center text-text-secondary">
            Nenhum dado no período. Execute o cálculo do FindMe Score para a data desejada.
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
