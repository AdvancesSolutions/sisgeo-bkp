import dayjs from "dayjs";
import "dayjs/locale/pt";
import { useEffect, useState } from "react";

import {
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
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import api from "@/lib/api";

interface RankingRow {
  id: string;
  name: string;
  type: "area" | "location" | "organization";
  score: number;
  eficiencia: number;
  conformidade: number;
  pontualidade: number;
  ocorrenciasAbertas: number;
}

interface DashboardRankingProps {
  date: dayjs.Dayjs;
  organizationId?: string;
  locationId?: string;
}

export default function DashboardRanking({
  date,
  organizationId,
  locationId,
}: DashboardRankingProps) {
  const [data, setData] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [groupBy, setGroupBy] = useState<"area" | "location" | "organization">("location");

  const load = () => {
    const params: Record<string, string> = {
      date: date.format("YYYY-MM-DD"),
      groupBy,
    };
    if (organizationId) params.organizationId = organizationId;
    if (locationId) params.locationId = locationId;

    setLoading(true);
    api
      .get<RankingRow[]>("/dashboard/ranking", { params })
      .then(({ data: res }) => setData(res))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  };

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const p: Record<string, string> = { date: date.format("YYYY-MM-DD") };
      if (organizationId) p.organizationId = organizationId;
      if (locationId) p.locationId = locationId;
      await api.get("/dashboard/findme-score/calculate", { params: p });
      load();
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    load();
  }, [date, groupBy, organizationId, locationId]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "success";
    if (score >= 60) return "warning";
    return "error";
  };

  const typeLabel = {
    area: "Setor",
    location: "Unidade",
    organization: "Cliente",
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" className="mb-3">
            Ranking de Eficiência
          </Typography>
          <Skeleton variant="rectangular" height={200} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <Typography variant="h6">Ranking de Eficiência</Typography>
          <Box className="flex items-center gap-2">
            <Button size="small" variant="outlined" onClick={handleCalculate} disabled={calculating}>
              {calculating ? "Calculando…" : "Calcular"}
            </Button>
            <FormControl size="small" variant="outlined" sx={{ minWidth: 140 }}>
              <InputLabel>Agrupar por</InputLabel>
              <Select
                value={groupBy}
                label="Agrupar por"
                onChange={(e) => setGroupBy(e.target.value as "area" | "location" | "organization")}
              >
                <MenuItem value="area">Setor</MenuItem>
                <MenuItem value="location">Unidade</MenuItem>
                <MenuItem value="organization">Cliente</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
        {data.length > 0 ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>{typeLabel[groupBy]}</TableCell>
                  <TableCell align="right">Score</TableCell>
                  <TableCell align="right">Pontualidade</TableCell>
                  <TableCell align="right">Conformidade</TableCell>
                  <TableCell align="right">Ocorrências</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row, idx) => (
                  <TableRow key={row.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={row.score}
                        size="small"
                        color={getScoreColor(row.score)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">{row.pontualidade}%</TableCell>
                    <TableCell align="right">{row.conformidade}%</TableCell>
                    <TableCell align="right">
                      {row.ocorrenciasAbertas > 0 ? (
                        <Chip label={row.ocorrenciasAbertas} size="small" color="error" />
                      ) : (
                        <span className="text-success">0</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box className="flex h-[200px] items-center justify-center text-text-secondary">
            Nenhum dado para a data selecionada. Calcule o FindMe Score primeiro.
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
