import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSnackbar } from "notistack";

import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Grid,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";

import NiFloppyDisk from "@/icons/nexture/ni-floppy-disk";
import { useCompanyLogo } from "@/contexts/CompanyLogoContext";

export function Configuracoes() {
  const { companyLogoUrl, setCompanyLogoUrl } = useCompanyLogo();
  const { enqueueSnackbar } = useSnackbar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [urlInput, setUrlInput] = useState("");
  const hasDataUrlLogo = companyLogoUrl.startsWith("data:");

  useEffect(() => {
    if (!hasDataUrlLogo) setUrlInput(companyLogoUrl);
  }, [companyLogoUrl, hasDataUrlLogo]);

  const handleSalvarUrl = () => {
    const url = urlInput.trim();
    setCompanyLogoUrl(url);
    enqueueSnackbar(url ? "Logo salva com sucesso." : "Logo removida.", { variant: "success" });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCompanyLogoUrl(dataUrl);
      setUrlInput("");
      enqueueSnackbar("Logo atualizada com sucesso. Clique em Salvar para confirmar.", { variant: "success" });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemoverLogo = () => {
    setCompanyLogoUrl("");
    setUrlInput("");
    enqueueSnackbar("Logo removida.", { variant: "success" });
  };

  return (
    <Grid container spacing={5} className="w-full" size={12}>
      {/* Cabeçalho: título, breadcrumbs e botão Salvar */}
      <Grid container spacing={2.5} className="w-full" size={12}>
        <Grid size={{ md: "grow", xs: 12 }}>
          <Typography variant="h1" component="h1" className="mb-0">
            Configurações
          </Typography>
          <Breadcrumbs>
            <Link color="inherit" to="/dashboard">
              Início
            </Link>
            <Typography variant="body2">Configurações</Typography>
          </Breadcrumbs>
        </Grid>
        <Grid size={{ xs: 12, md: "auto" }} className="flex flex-row items-start gap-2">
          <Button
            variant="surface"
            color="grey"
            size="medium"
            className="surface-standard"
            startIcon={<NiFloppyDisk size="medium" />}
            onClick={handleSalvarUrl}
          >
            Salvar
          </Button>
        </Grid>
      </Grid>

      {/* Conteúdo em grid */}
      <Grid container size={12} className="items-start">
        <Grid size={{ lg: 8, xs: 12 }}>
          <Card className="mb-5">
            <CardContent>
              <Typography variant="h6" component="h2" className="card-title mb-3">
                Logo da empresa
              </Typography>
              <Typography variant="body2" className="mb-3 text-text-secondary">
                Defina a logo exibida no cabeçalho, ao lado do nome do sistema. Informe uma URL ou envie uma imagem (a logo será ajustada sem distorcer). Clique em <strong>Salvar</strong> para aplicar.
              </Typography>

              {companyLogoUrl ? (
                <Box className="mb-3 flex flex-wrap items-center gap-3">
                  <Box
                    className="flex h-20 w-36 flex-none items-center justify-center overflow-hidden rounded border border-[var(--mui-palette-divider)] bg-grey-500/5 p-2"
                    title="Preview da logo"
                  >
                    <Box
                      component="img"
                      src={companyLogoUrl}
                      alt="Preview logo"
                      sx={{
                        maxHeight: "100%",
                        maxWidth: "100%",
                        width: "auto",
                        height: "auto",
                        objectFit: "contain",
                        objectPosition: "center",
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </Box>
                  <Button variant="outlined" color="grey" size="small" onClick={handleRemoverLogo}>
                    Remover logo
                  </Button>
                </Box>
              ) : null}

              <Box className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <TextField
                  label="URL da logo"
                  placeholder={hasDataUrlLogo ? "Logo definida por arquivo (clique Salvar para confirmar)" : "https://… ou use o botão para enviar arquivo"}
                  value={hasDataUrlLogo ? "" : urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSalvarUrl()}
                  variant="outlined"
                  size="small"
                  fullWidth
                  className="sm:max-w-md"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button size="small" color="primary" onClick={handleSalvarUrl}>
                          Salvar
                        </Button>
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  size="medium"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Selecionar arquivo
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  aria-hidden
                  onChange={handleFileChange}
                />
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" component="h2" className="card-title mb-2">
                Outras opções
              </Typography>
              <Typography variant="body1" className="text-text-secondary">
                Outras opções de configuração do sistema serão exibidas aqui em breve.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ lg: 4, xs: 12 }} className="hidden lg:block">
          <Card>
            <CardContent>
              <Typography variant="h6" component="h2" className="card-title px-0 pt-0">
                Dicas
              </Typography>
              <Typography variant="body2" className="mt-2 text-text-secondary">
                • Use imagens em PNG ou SVG para melhor qualidade.
                <br />
                • A logo no cabeçalho é redimensionada automaticamente sem distorcer.
                <br />
                • Após alterar a URL ou enviar um arquivo, clique em <strong>Salvar</strong> no topo da página.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Grid>
  );
}
