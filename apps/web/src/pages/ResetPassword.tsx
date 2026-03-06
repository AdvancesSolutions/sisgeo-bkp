import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  InputAdornment,
  Paper,
  Typography,
} from "@mui/material";

import Logo from "@/components/logo/Logo";
import NiEyeClose from "@/icons/nexture/ni-eye-close";
import NiEyeOpen from "@/icons/nexture/ni-eye-open";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) setError("Link inválido. Solicite uma nova redefinição de senha.");
  }, [token]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => navigate("/login"), 3000);
      return () => clearTimeout(t);
    }
  }, [success, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, newPassword: password });
      setSuccess(true);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Erro ao redefinir senha. O link pode ter expirado."));
    } finally {
      setLoading(false);
    }
  }

  const handleClickShowPassword = () => setShowPassword((s) => !s);

  if (!token) {
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
            <Alert severity="error">Link inválido. Solicite uma nova redefinição de senha.</Alert>
            <Button component={Link} to="/forgot-password" variant="contained" fullWidth>
              Solicitar novo link
            </Button>
            <Box className="text-center">
              <Link to="/login" className="link-text-secondary link-underline-hover text-sm font-semibold">
                Voltar ao login
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    );
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
            Nova senha
          </Typography>
          <Typography variant="body1" className="text-text-primary mb-4">
            Defina uma nova senha para sua conta.
          </Typography>

          {success ? (
            <Alert severity="success">
              Senha alterada com sucesso! Redirecionando para o login…
            </Alert>
          ) : (
            <Box component="form" onSubmit={handleSubmit} className="flex flex-col gap-4">
              <FormControl variant="standard" size="small" fullWidth>
                <FormLabel component="label">Nova senha</FormLabel>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton onClick={handleClickShowPassword} edge="end" aria-label="mostrar senha">
                        {showPassword ? <NiEyeClose size="medium" /> : <NiEyeOpen size="medium" />}
                      </IconButton>
                    </InputAdornment>
                  }
                />
              </FormControl>
              <FormControl variant="standard" size="small" fullWidth>
                <FormLabel component="label">Confirmar senha</FormLabel>
                <Input
                  id="confirm"
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </FormControl>

              {error && (
                <Alert severity="error" onClose={() => setError("")}>
                  {error}
                </Alert>
              )}

              <Button type="submit" variant="contained" disabled={loading} fullWidth>
                {loading ? "Salvando…" : "Redefinir senha"}
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
