import type { SyntheticEvent } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { Breadcrumbs, Button, Fade, Grid, Menu, MenuItem, Tooltip, Typography } from "@mui/material";

import NiEllipsisHorizontal from "@/icons/nexture/ni-ellipsis-horizontal";
import { useAuth } from "@/contexts/AuthContext";

import PerfilAchievements from "@/pages/perfil/sections/PerfilAchievements";
import PerfilActivity from "@/pages/perfil/sections/PerfilActivity";
import PerfilLogs from "@/pages/perfil/sections/PerfilLogs";
import PerfilMenu from "@/pages/perfil/sections/PerfilMenu";
import PerfilProjects from "@/pages/perfil/sections/PerfilProjects";
import PerfilSpecialties from "@/pages/perfil/sections/PerfilSpecialties";
import PerfilStats from "@/pages/perfil/sections/PerfilStats";

export function Perfil() {
  const { user } = useAuth();
  const displayName = user?.name ?? "Usuário";
  const [anchorElMainMenu, setAnchorElMainMenu] = useState<Element | null>(null);
  const open = Boolean(anchorElMainMenu);

  const handleClickMainMenu = (event: SyntheticEvent) => {
    setAnchorElMainMenu(event.currentTarget as Element);
  };
  const handleCloseMainMenu = () => {
    setAnchorElMainMenu(null);
  };

  return (
    <Grid container spacing={5} className="w-full" size={12}>
      {/* Cabeçalho: nome + breadcrumbs + botão Ações */}
      <Grid container spacing={2.5} className="w-full" size={12}>
        <Grid size={{ md: "grow", xs: 12 }}>
          <Typography variant="h1" component="h1" className="mb-0">
            {displayName}
          </Typography>
          <Breadcrumbs>
            <Link color="inherit" to="/dashboard">
              Início
            </Link>
            <Typography variant="body2">Perfil</Typography>
            <Typography variant="body2">{displayName}</Typography>
          </Breadcrumbs>
        </Grid>

        <Grid size={{ xs: 12, md: "auto" }} className="flex flex-row items-start gap-2">
          <Tooltip title="Ações">
            <Button className="icon-only surface-standard" color="grey" variant="surface" onClick={handleClickMainMenu}>
              <NiEllipsisHorizontal size="medium" />
            </Button>
          </Tooltip>

          <Menu
            anchorEl={anchorElMainMenu}
            open={open}
            onClose={handleCloseMainMenu}
            className="mt-1"
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            slots={{ transition: Fade }}
          >
            <MenuItem onClick={handleCloseMainMenu}>Contato</MenuItem>
            <MenuItem onClick={handleCloseMainMenu}>Seguir</MenuItem>
            <MenuItem onClick={handleCloseMainMenu}>Silenciar</MenuItem>
            <MenuItem onClick={handleCloseMainMenu}>Denunciar</MenuItem>
          </Menu>
        </Grid>
      </Grid>

      {/* Coluna esquerda: card do perfil, conquistas, informações */}
      <Grid container size={12}>
        <Grid size={{ lg: 4, xs: 12 }}>
          <PerfilMenu selected="overview" />
          <PerfilAchievements />
          <PerfilSpecialties />
        </Grid>

        {/* Coluna direita: estatísticas, tarefas, atividade, logs */}
        <Grid container size={{ lg: 8, xs: 12 }}>
          <Grid size={12}>
            <PerfilStats />
          </Grid>
          <Grid size={12}>
            <PerfilProjects />
          </Grid>
          <Grid size={{ lg: 8, xs: 12 }}>
            <PerfilActivity />
          </Grid>
          <Grid size={{ lg: 4, xs: 12 }}>
            <PerfilLogs />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}
