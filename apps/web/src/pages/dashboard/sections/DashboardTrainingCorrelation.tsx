import { useEffect, useState } from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";
import api from "@/lib/api";

interface CorrelacaoData {
  comTreinamento: { mediaNota: number; total: number; reprovacoes: number };
  semTreinamento: { mediaNota: number; total: number; reprovacoes: number };
}

export default function DashboardTrainingCorrelation() {
  const [data, setData] = useState<CorrelacaoData | null>(null);

  useEffect(() => {
    api
      .get<CorrelacaoData>("/procedimentos/dashboard/correlacao")
      .then(({ data: d }) => setData(d))
      .catch(() => setData(null));
  }, []);

  if (!data) return null;

  const { comTreinamento, semTreinamento } = data;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Treinamento vs Notas da IA
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Correlação entre vídeos assistidos e aprovação nas fotos
        </Typography>
        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
          <Box
            sx={{
              flex: 1,
              minWidth: 140,
              p: 2,
              borderRadius: 2,
              bgcolor: "success.light",
              color: "success.contrastText",
            }}
          >
            <Typography variant="overline">Com treinamento</Typography>
            <Typography variant="h4">{comTreinamento.mediaNota.toFixed(0)}%</Typography>
            <Typography variant="body2">Média de aprovação</Typography>
            <Typography variant="body2">{comTreinamento.reprovacoes} reprovações</Typography>
          </Box>
          <Box
            sx={{
              flex: 1,
              minWidth: 140,
              p: 2,
              borderRadius: 2,
              bgcolor: "grey.300",
              color: "grey.800",
            }}
          >
            <Typography variant="overline">Sem treinamento</Typography>
            <Typography variant="h4">{semTreinamento.mediaNota.toFixed(0)}%</Typography>
            <Typography variant="body2">Média de aprovação</Typography>
            <Typography variant="body2">{semTreinamento.reprovacoes} reprovações</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
