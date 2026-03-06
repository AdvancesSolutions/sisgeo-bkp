import { Box, Card, CardContent, Chip, Typography } from "@mui/material";

export default function PerfilSpecialties() {
  return (
    <Card className="mb-5">
      <CardContent>
        <Typography variant="h6" component="h6" className="card-title">
          Informações
        </Typography>

        <Box className="flex flex-row flex-wrap gap-2">
          <Chip label="SIGEO" variant="outlined" size="small" className="text-sm" />
          <Chip label="Tarefas" variant="outlined" size="small" className="text-sm" />
          <Chip label="Ponto" variant="outlined" size="small" className="text-sm" />
          <Chip label="Relatórios" variant="outlined" size="small" className="text-sm" />
        </Box>
      </CardContent>
    </Card>
  );
}
