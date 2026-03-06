import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Alert, Box, Button, FormControl, FormLabel, Input, Paper, Typography } from "@mui/material";

import Logo from "@/components/logo/Logo";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => navigate("/login"), 5000);
      return () => clearTimeout(t);
    }
  }, [success, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Informe o e-mail.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.post<{ message: string }>("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });
      setSuccess(true);
      setError("");
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Erro ao enviar. Tente novamente."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box className="bg-waves flex min-h-screen w-full items-center justify-center bg-cover bg-center p-4">
      <Paper elevation={3} className="bg-background-paper shadow-darker-xs w-lg max-w-full rounded-4xl py-14">
        <Box className="flex flex-col gap-4 px-8 sm:px-14">
          <Box className="mb-14 flex justify-center">
            <Box className="flex items-center gap-2">
              <Logo classNameFull="hidden md:block" classNameMobile="md:hidden" />
              <Typography variant="h6" component="span" className="font-semibold text-text-primary">
                SISGEO
              </Typography>
            </Box>
          </Box>

          <Typography variant="h1" component="h1" className="mb-2">
            Esqueci minha senha
          </Typography>
          <Typography variant="body1" className="text-text-primary mb-4">
            Informe seu e-mail e enviaremos um link para redefinir sua senha.
          </Typography>

          {success ? (
            <Alert severity="success">
              Se o e-mail estiver cadastrado, você receberá o link em breve. Verifique sua caixa de
              entrada e spam. Redirecionando para o login…
            </Alert>
          ) : (
            <Box component="form" onSubmit={handleSubmit} className="flex flex-col gap-4">
              <FormControl variant="standard" size="small" fullWidth>
                <FormLabel component="label">E-mail</FormLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </FormControl>

              {error && (
                <Alert severity="error" onClose={() => setError("")}>
                  {error}
                </Alert>
              )}

              <Button type="submit" variant="contained" disabled={loading} fullWidth>
                {loading ? "Enviando…" : "Enviar link"}
              </Button>
            </Box>
          )}

          <Box className="mt-4 text-center">
            <Link to="/login" className="link-text-secondary link-underline-hover text-sm font-semibold">
              Voltar ao login
            </Link>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
