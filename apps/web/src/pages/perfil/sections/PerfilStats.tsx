import { Link } from "react-router-dom";

import { Box, Card, CardContent, Grid, Typography } from "@mui/material";

import NiClock from "@/icons/nexture/ni-clock";
import NiListSquare from "@/icons/nexture/ni-list-square";
import NiScreen from "@/icons/nexture/ni-screen";
import NiTriangleUp from "@/icons/nexture/ni-triangle-up";
import NiUsers from "@/icons/nexture/ni-users";

export default function PerfilStats() {
  return (
    <Grid container size={12} spacing={2.5}>
      <Grid size={{ lg: 6, xs: 12 }}>
        <Card component={Link} to="/tasks" className="flex flex-row items-center p-1 transition-transform hover:scale-[1.02]" sx={{ textDecoration: "none" }}>
          <Box className="bg-primary-light/10 flex h-24 w-16 flex-none items-center justify-center rounded-2xl">
            <NiListSquare className="text-primary" size="large" />
          </Box>
          <CardContent>
            <Typography variant="body1" className="leading-5 text-text-secondary">
              Tarefas
            </Typography>
            <Box className="flex flex-row items-center gap-2">
              <Typography variant="h5" className="text-leading-5">
                —
              </Typography>
              <Box className="flex flex-row items-center">
                <NiTriangleUp className="text-success" size="medium" />
                <Typography variant="body2" className="text-success">
                  Ver todas
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ lg: 6, xs: 12 }}>
        <Card component={Link} to="/timeclock" className="flex flex-row items-center p-1 transition-transform hover:scale-[1.02]" sx={{ textDecoration: "none" }}>
          <Box className="bg-secondary-light/10 flex h-24 w-16 flex-none items-center justify-center rounded-2xl">
            <NiClock className="text-secondary" size="large" />
          </Box>
          <CardContent>
            <Typography variant="body1" className="leading-5 text-text-secondary">
              Ponto
            </Typography>
            <Box className="flex flex-row items-center gap-2">
              <Typography variant="h5" className="text-leading-5">
                —
              </Typography>
              <Box className="flex flex-row items-center">
                <NiTriangleUp className="text-success" size="medium" />
                <Typography variant="body2" className="text-success">
                  Registrar
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ lg: 6, xs: 12 }}>
        <Card component={Link} to="/dashboard" className="flex flex-row items-center p-1 transition-transform hover:scale-[1.02]" sx={{ textDecoration: "none" }}>
          <Box className="bg-accent-1-light/10 flex h-24 w-16 flex-none items-center justify-center rounded-2xl">
            <NiScreen className="text-accent-1" size="large" />
          </Box>
          <CardContent>
            <Typography variant="body1" className="leading-5 text-text-secondary">
              Dashboard
            </Typography>
            <Box className="flex flex-row items-center gap-2">
              <Typography variant="h5" className="text-leading-5">
                —
              </Typography>
              <Box className="flex flex-row items-center">
                <NiTriangleUp className="text-success" size="medium" />
                <Typography variant="body2" className="text-success">
                  Acessar
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ lg: 6, xs: 12 }}>
        <Card component={Link} to="/employees" className="flex flex-row items-center p-1 transition-transform hover:scale-[1.02]" sx={{ textDecoration: "none" }}>
          <Box className="bg-accent-2-light/10 flex h-24 w-16 flex-none items-center justify-center rounded-2xl">
            <NiUsers className="text-accent-2" size="large" />
          </Box>
          <CardContent>
            <Typography variant="body1" className="leading-5 text-text-secondary">
              Equipe
            </Typography>
            <Box className="flex flex-row items-center gap-2">
              <Typography variant="h5" className="text-leading-5">
                —
              </Typography>
              <Box className="flex flex-row items-center">
                <NiTriangleUp className="text-success" size="medium" />
                <Typography variant="body2" className="text-success">
                  Ver
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
