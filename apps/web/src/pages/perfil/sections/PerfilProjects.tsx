import { Link } from "react-router-dom";

import { Box, Button, Card, CardContent, Typography } from "@mui/material";

import NiChevronRightSmall from "@/icons/nexture/ni-chevron-right-small";

export default function PerfilProjects() {
  return (
    <Card>
      <CardContent>
        <Box className="mb-3 flex flex-row items-center leading-6">
          <Typography variant="h6" component="h6" className="flex-1 card-title">
            Tarefas recentes
          </Typography>
          <Button component={Link} to="/tasks" size="tiny" color="grey" variant="text" endIcon={<NiChevronRightSmall size={16} className="rtl:rotate-180" />}>
            Ver todas
          </Button>
        </Box>
        <Typography variant="body2" className="text-text-secondary">
          Acesse a lista de tarefas para ver e gerenciar suas atividades.
        </Typography>
      </CardContent>
    </Card>
  );
}
