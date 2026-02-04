import { Box, Card, CardContent, Typography } from "@mui/material";

import NiChartBar from "@/icons/nexture/ni-chart-bar";
import NiChartPie from "@/icons/nexture/ni-chart-pie";
import NiClock from "@/icons/nexture/ni-clock";
import NiDocumentFull from "@/icons/nexture/ni-document-full";
import NiCheckSquare from "@/icons/nexture/ni-check-square";

const REPORT_ITEMS = [
  { id: "prod", label: "Produtividade", desc: "Tarefas por período", icon: NiChartBar },
  { id: "ponto", label: "Ponto", desc: "Horas por funcionário", icon: NiClock },
  { id: "valid", label: "Validações", desc: "Aprovados vs recusados", icon: NiCheckSquare },
  { id: "pdf", label: "Exportar PDF", desc: "Relatórios em PDF", icon: NiDocumentFull },
];

export function Reports() {
  return (
    <Box>
      <Typography variant="h6" component="h1" className="mb-4 text-text-primary">
        Relatórios
      </Typography>
      <Box className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {REPORT_ITEMS.map(({ id, label, desc, icon: Icon }) => (
          <Card key={id} className="transition-colors hover:border-grey-300">
            <CardContent className="flex flex-row items-center gap-3">
              <Box className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-grey-100 text-text-secondary">
                <Icon size="medium" />
              </Box>
              <Box>
                <Typography variant="subtitle1" className="font-medium text-text-primary">
                  {label}
                </Typography>
                <Typography variant="body2" className="text-text-secondary">
                  {desc}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <NiChartPie size="large" className="mb-2 text-text-disabled" />
          <Typography variant="body1" className="text-text-secondary">
            Relatórios detalhados em desenvolvimento.
          </Typography>
          <Typography variant="body2" className="mt-1 text-text-secondary">
            KPIs e exportação PDF em próxima versão.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
