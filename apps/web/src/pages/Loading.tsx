import { Box, CircularProgress, Typography } from "@mui/material";

export default function Loading() {
  return (
    <Box
      className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-background"
      sx={{ minHeight: "100vh" }}
    >
      <CircularProgress />
      <Typography variant="body2" className="text-text-secondary">
        Carregando…
      </Typography>
    </Box>
  );
}
