import { Box, Card, CardContent, Grid, Typography } from "@mui/material";

import NiCrossSquare from "@/icons/nexture/ni-cross-square";
import NiExclamationSquare from "@/icons/nexture/ni-exclamation-square";
import NiTrophy from "@/icons/nexture/ni-trophy";

export function PainelControle() {
  return (
    <Box>
      <Box className="mb-4 flex flex-row items-center justify-between">
        <Typography variant="h6" component="h1" className="text-text-primary">
          Painel de Controle
        </Typography>
      </Box>

      <Grid container spacing={2.5}>
        {/* Row 1: Score BacPro (fundo verde claro) */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card className="bg-primary-light/10 border-0 shadow-none">
            <CardContent className="flex flex-col gap-1">
              <Box className="flex items-end justify-between">
                <Typography variant="h3" component="p" className="font-bold text-text-primary">
                  87
                </Typography>
                <NiTrophy size={24} className="text-primary" />
              </Box>
              <Typography variant="body2" className="font-medium text-text-primary">
                Score BacPro Atual
              </Typography>
              <Typography variant="caption" className="text-text-secondary">
                Pontuação de 0 a 100
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card className="bg-primary-light/10 border-0 shadow-none">
            <CardContent className="flex flex-col gap-1">
              <Box className="flex items-end justify-between">
                <Typography variant="h3" component="p" className="font-bold text-text-primary">
                  97
                </Typography>
                <NiTrophy size={24} className="text-primary" />
              </Box>
              <Typography variant="body2" className="font-medium text-text-primary">
                Score BacPro Mensal
              </Typography>
              <Typography variant="caption" className="text-text-secondary">
                Pontuação de 0 a 100
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card className="bg-primary-light/10 border-0 shadow-none">
            <CardContent className="flex flex-col gap-1">
              <Box className="flex items-end justify-between">
                <Typography variant="h3" component="p" className="font-bold text-text-primary">
                  98
                </Typography>
                <NiTrophy size={24} className="text-primary" />
              </Box>
              <Typography variant="body2" className="font-medium text-text-primary">
                Score BacPro Anual
              </Typography>
              <Typography variant="caption" className="text-text-secondary">
                Pontuação de 0 a 100
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Row 2 */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent className="flex flex-col gap-1">
              <Typography variant="body2" className="font-medium text-text-primary">
                Ambientes em Risco Biológico
              </Typography>
              <Typography variant="h5" component="p" className="font-bold text-text-primary">
                13/74
              </Typography>
              <Box className="flex items-center gap-1 text-error">
                <NiExclamationSquare size="small" />
                <Typography variant="caption">18% em risco biológico</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent className="flex flex-col gap-1">
              <Typography variant="body2" className="font-medium text-text-primary">
                Desinfecções em Andamento
              </Typography>
              <Typography variant="h5" component="p" className="font-bold text-text-primary">
                3
              </Typography>
              <Typography variant="caption" className="text-warning">
                Agora
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent className="flex flex-col gap-1">
              <Typography variant="body2" className="font-medium text-text-primary">
                Tempo Médio de Concorrentes
              </Typography>
              <Typography variant="h5" component="p" className="font-bold text-text-primary">
                30 minutos
              </Typography>
              <Typography variant="caption" className="text-text-secondary">
                Últimos 30 dias
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Row 3 */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent className="flex flex-col gap-1">
              <Typography variant="body2" className="font-medium text-text-primary">
                Tempo Médio de Terminais
              </Typography>
              <Typography variant="h5" component="p" className="font-bold text-text-primary">
                60 minutos
              </Typography>
              <Typography variant="caption" className="text-text-secondary">
                Últimos 30 dias
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent className="flex flex-col gap-1">
              <Typography variant="body2" className="font-medium text-text-primary">
                Desinfecções Terminais Químicas (Hoje)
              </Typography>
              <Typography variant="h5" component="p" className="font-bold text-text-primary">
                35
              </Typography>
              <Box className="flex items-center gap-1 text-error">
                <NiCrossSquare size="small" />
                <Typography variant="caption">0 canceladas</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent className="flex flex-col gap-1">
              <Typography variant="body2" className="font-medium text-text-primary">
                Limpezas Concorrentes (Hoje)
              </Typography>
              <Typography variant="h5" component="p" className="font-bold text-text-primary">
                67
              </Typography>
              <Box className="flex items-center gap-1 text-error">
                <NiCrossSquare size="small" />
                <Typography variant="caption">0 canceladas</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Row 4 */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent className="flex flex-col gap-1">
              <Typography variant="body2" className="font-medium text-text-primary">
                Atrasadas
              </Typography>
              <Typography variant="h4" component="p" className="font-bold text-text-primary">
                10
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent className="flex flex-col gap-1">
              <Typography variant="body2" className="font-medium text-text-primary">
                Para Hoje (Pendentes e Atrasadas)
              </Typography>
              <Typography variant="h4" component="p" className="font-bold text-text-primary">
                67
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent className="flex flex-col gap-1">
              <Typography variant="body2" className="font-medium text-text-primary">
                Realizadas Hoje
              </Typography>
              <Typography variant="h4" component="p" className="font-bold text-text-primary">
                18
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
