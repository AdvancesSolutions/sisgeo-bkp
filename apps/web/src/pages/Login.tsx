import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  InputAdornment,
  Paper,
  Typography,
} from "@mui/material";

import Logo from "@/components/logo/Logo";
import { useAuth } from "@/contexts/AuthContext";
import NiEyeClose from "@/icons/nexture/ni-eye-close";
import NiEyeOpen from "@/icons/nexture/ni-eye-open";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M19.6169 10.2876C19.6169 9.60932 19.5561 8.95714 19.443 8.33105H10.4343V12.0354H15.5822C15.3561 13.2267 14.6778 14.2354 13.6604 14.9137V17.3224H16.7648C18.5735 15.6528 19.6169 13.2006 19.6169 10.2876Z"
        fill="#4285F4"
      />
      <path
        d="M10.4346 19.6346C13.0172 19.6346 15.1825 18.7825 16.7651 17.3216L13.6607 14.9129C12.8086 15.4868 11.7216 15.8346 10.4346 15.8346C7.94768 15.8346 5.83464 14.1564 5.07812 11.8955H1.89551V14.3651C3.46942 17.4868 6.69551 19.6346 10.4346 19.6346Z"
        fill="#34A853"
      />
      <path
        d="M5.07832 11.8866C4.88702 11.3127 4.77398 10.704 4.77398 10.0692C4.77398 9.4344 4.88702 8.8257 5.07832 8.25179V5.78223H1.89572C1.24354 7.06918 0.869629 8.52136 0.869629 10.0692C0.869629 11.617 1.24354 13.0692 1.89572 14.3561L4.37398 12.4257L5.07832 11.8866Z"
        fill="#FBBC05"
      />
      <path
        d="M10.4346 4.31358C11.8433 4.31358 13.0955 4.80054 14.0955 5.73967L16.8346 3.00054C15.1738 1.45271 13.0172 0.504883 10.4346 0.504883C6.69551 0.504883 3.46942 2.65271 1.89551 5.78314L5.07812 8.25271C5.83464 5.99184 7.94768 4.31358 10.4346 4.31358Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function Login() {
  const [email, setEmail] = useState("admin@sigeo.local");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { user, login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    const fromSessionExpired =
      searchParams.get("sessionExpired") === "1" ||
      sessionStorage.getItem("sessionExpired") === "1";
    if (fromSessionExpired) {
      setError("Sessão expirada. Faça login novamente.");
      try {
        sessionStorage.removeItem("sessionExpired");
      } catch {
        // ignorar
      }
    }
  }, [searchParams]);

  function getLoginErrorMessage(err: unknown): string {
    const ax = err as {
      code?: string;
      message?: string;
      response?: { status?: number; data?: { message?: string } };
    };
    const res = ax?.response;
    if (res?.status === 401) {
      return res?.data?.message ?? "E-mail ou senha incorretos.";
    }
    if (res?.data?.message) return res.data.message;
    const isNetworkError =
      ax?.code === "ERR_NETWORK" ||
      ax?.message === "Network Error" ||
      ax?.code === "ECONNABORTED" ||
      !res;
    if (isNetworkError && import.meta.env.DEV) {
      return "API não está acessível. Inicie a API com: pnpm dev:api (porta 3000).";
    }
    if (isNetworkError) {
      return "Erro ao conectar. Verifique a rede e tente novamente.";
    }
    return "Erro ao conectar. Verifique a rede e tente novamente.";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(getLoginErrorMessage(err));
    }
  }

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault();
  const handleMouseUpPassword = (e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault();

  return (
    <Box className="bg-waves flex min-h-screen w-full items-center justify-center bg-cover bg-center p-4">
      <Paper elevation={3} className="bg-background-paper shadow-darker-xs w-lg max-w-full rounded-4xl py-14">
        <Box className="flex flex-col gap-4 px-8 sm:px-14">
          <Box className="flex flex-col">
            <Box className="mb-14 flex justify-center">
              <Box className="flex items-center gap-2">
                <Logo classNameFull="hidden md:block" classNameMobile="md:hidden" />
                <Typography variant="h6" component="span" className="font-semibold text-text-primary">
                  SISGEO
                </Typography>
              </Box>
            </Box>

            <Box className="flex flex-col gap-10">
              <Box className="flex flex-col">
                <Typography variant="h1" component="h1" className="mb-2">
                  Entrar
                </Typography>
                <Typography variant="body1" className="text-text-primary">
                  Acesse sua conta de forma rápida e segura para começar.
                </Typography>
              </Box>

              <Box className="flex flex-col gap-5">
                <Box className="flex flex-col gap-2">
                  <Button variant="outlined" color="grey" className="w-full" disabled>
                    <Box className="me-2">
                      <GoogleIcon />
                    </Box>
                    Entrar com Google
                  </Button>
                </Box>

                <Divider className="text-text-secondary my-0 text-sm">
                  OU
                </Divider>

                <Box component="form" onSubmit={handleSubmit} className="flex flex-col">
                  <FormControl className="outlined" variant="standard" size="small" fullWidth>
                    <FormLabel component="label">E-mail</FormLabel>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder=""
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </FormControl>

                  <FormControl className="outlined" variant="standard" size="small" fullWidth>
                    <FormLabel component="label">Senha</FormLabel>
                    <Input
                      size="small"
                      id="password"
                      name="password"
                      placeholder=""
                      autoComplete="off"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      required
                      endAdornment={
                        <InputAdornment position="end">
                          <IconButton
                            onClick={handleClickShowPassword}
                            onMouseDown={handleMouseDownPassword}
                            onMouseUp={handleMouseUpPassword}
                          >
                            {showPassword ? (
                              <NiEyeClose size="medium" className="text-text-secondary" />
                            ) : (
                              <NiEyeOpen size="medium" className="text-text-secondary" />
                            )}
                          </IconButton>
                        </InputAdornment>
                      }
                    />
                  </FormControl>

                  {error && (
                    <Alert
                      severity="error"
                      className="neutral bg-background-paper/60! mb-4"
                    >
                      {error}
                    </Alert>
                  )}

                  <Box className="flex flex-col gap-2">
                    <Link
                      to="#"
                      className="link-text-secondary link-underline-hover text-center text-sm font-semibold"
                    >
                      Redefinir senha
                    </Link>
                    <Button type="submit" variant="contained" className="mb-4" disabled={isLoading}>
                      {isLoading ? "Entrando..." : "Continuar"}
                    </Button>
                  </Box>

                  <Typography variant="body2" className="text-text-secondary">
                    Ao clicar em Continuar ou nos botões de rede social, você concorda com os termos de uso do SIGEO.
                  </Typography>
                </Box>
              </Box>

              <Divider className="text-text-secondary my-0 text-sm" />

              <Box className="flex flex-col">
                <Typography variant="h6" component="h6">
                  Começar
                </Typography>
                <Typography variant="body1" className="text-text-secondary">
                  Novo no SIGEO? Entre em contato com o administrador para criar uma conta.
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
