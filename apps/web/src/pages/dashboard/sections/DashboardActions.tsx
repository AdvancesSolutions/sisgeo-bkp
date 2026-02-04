import { Link } from "react-router-dom";

import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import { Grid } from "@mui/material";

import NiBag from "@/icons/nexture/ni-bag";
import NiCellsPlus from "@/icons/nexture/ni-cells-plus";
import NiChartLine from "@/icons/nexture/ni-chart-line";
import NiPercent from "@/icons/nexture/ni-percent";

export default function DashboardActions() {
  return (
    <>
      <Typography variant="h6" component="h6" className="mt-2 mb-3 lg:mt-0">
        Ações rápidas
      </Typography>

      <Grid size={{ xs: 12 }} container spacing={2.5}>
        <Grid size={{ lg: 12, md: 6, xs: 12 }}>
          <Card component={Link} to="/tasks" className="flex flex-row p-1 transition-transform hover:scale-[1.02]">
            <Box className="bg-primary-light/10 flex w-16 flex-none items-center justify-center rounded-2xl">
              <NiBag className="text-primary" size={"large"} />
            </Box>
            <CardContent>
              <Typography variant="subtitle2" className="leading-5 transition-colors">
                Nova tarefa
              </Typography>
              <Typography variant="body1" className="text-text-secondary line-clamp-1 leading-5">
                Criar e atribuir uma nova tarefa
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ lg: 12, md: 6, xs: 12 }}>
          <Card component={Link} to="/employees" className="flex flex-row p-1 transition-transform hover:scale-[1.02]">
            <Box className="bg-secondary-light/10 flex w-16 flex-none items-center justify-center rounded-2xl">
              <NiCellsPlus className="text-secondary" size={"large"} />
            </Box>
            <CardContent>
              <Typography variant="subtitle2" className="leading-5 transition-colors">
                Funcionários
              </Typography>
              <Typography variant="body1" className="text-text-secondary line-clamp-1 leading-5">
                Gerenciar equipe e cadastros
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ lg: 12, md: 6, xs: 12 }}>
          <Card component={Link} to="/validation" className="flex flex-row p-1 transition-transform hover:scale-[1.02]">
            <Box className="bg-accent-1-light/10 flex w-16 flex-none items-center justify-center rounded-2xl">
              <NiPercent className="text-accent-1" size={"large"} />
            </Box>
            <CardContent>
              <Typography variant="subtitle2" className="leading-5 transition-colors">
                Validação
              </Typography>
              <Typography variant="body1" className="text-text-secondary line-clamp-1 leading-5">
                Tarefas aguardando validação
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ lg: 12, md: 6, xs: 12 }}>
          <Card component={Link} to="/reports" className="flex flex-row p-1 transition-transform hover:scale-[1.02]">
            <Box className="bg-accent-2-light/10 flex w-16 flex-none items-center justify-center rounded-2xl">
              <NiChartLine className="text-accent-2" size={"large"} />
            </Box>
            <CardContent className="flex w-full flex-row justify-between">
              <Box>
                <Typography variant="subtitle2" className="leading-5 transition-colors">
                  Relatórios
                </Typography>
                <Typography variant="body1" className="text-text-secondary line-clamp-1 leading-5">
                  Métricas e relatórios do sistema
                </Typography>
              </Box>
              <Button className="pointer-events-none self-center" size="tiny" color="accent-2" variant="pastel">
                Novo
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
