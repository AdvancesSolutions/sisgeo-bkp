import { useNavigate } from "react-router-dom";

import { Avatar, Box, Button, Card, CardContent, ListItemIcon, MenuItem, MenuList, Typography } from "@mui/material";

import NiEllipsisHorizontal from "@/icons/nexture/ni-ellipsis-horizontal";
import NiFolder from "@/icons/nexture/ni-folder";
import NiHearts from "@/icons/nexture/ni-hearts";
import NiLock from "@/icons/nexture/ni-lock";
import NiMessages from "@/icons/nexture/ni-messages";
import NiPulse from "@/icons/nexture/ni-pulse";
import { useAuth } from "@/contexts/AuthContext";

type PerfilMenuProps = {
  selected: "overview" | "projects" | "permissions" | "friends";
};

export default function PerfilMenu({ selected }: PerfilMenuProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const displayName = user?.name ?? "Usuário";
  const displayEmail = user?.email ?? "";

  return (
    <Card className="mb-5">
      <CardContent className="flex flex-col items-center gap-5">
        <Box className="flex flex-col items-center">
          <Avatar alt={displayName} src={undefined} className="mb-2 h-20 w-20 rounded-4xl" />
          <Typography variant="subtitle1" component="p">
            {displayName}
          </Typography>
          <Typography variant="body2" component="p" className="-mt-0.5 text-text-secondary">
            {displayEmail || "—"}
          </Typography>
        </Box>

        <Box className="flex w-full max-w-sm flex-row gap-1">
          <Button size="medium" color="primary" variant="contained" startIcon={<NiMessages size="medium" />} className="flex-1">
            Contato
          </Button>
          <Button size="medium" color="primary" variant="pastel" className="flex-1">
            Seguir
          </Button>
          <Button className="icon-only flex-none" size="medium" color="primary" variant="pastel" startIcon={<NiEllipsisHorizontal size="medium" />} />
        </Box>

        <Box className="w-full">
          <MenuList className="p-0">
            <MenuItem selected={selected === "overview"} onClick={() => navigate("/perfil")}>
              <ListItemIcon>
                <NiPulse size={20} />
              </ListItemIcon>
              Visão geral
            </MenuItem>
            <MenuItem selected={selected === "projects"} onClick={() => navigate("/tasks")}>
              <ListItemIcon>
                <NiFolder size={20} />
              </ListItemIcon>
              Tarefas
            </MenuItem>
            <MenuItem selected={selected === "permissions"} onClick={() => navigate("/perfil")}>
              <ListItemIcon>
                <NiLock size={20} />
              </ListItemIcon>
              Permissões
            </MenuItem>
            <MenuItem selected={selected === "friends"} onClick={() => navigate("/perfil")}>
              <ListItemIcon>
                <NiHearts size={20} />
              </ListItemIcon>
              Equipe
            </MenuItem>
          </MenuList>
        </Box>
      </CardContent>
    </Card>
  );
}
