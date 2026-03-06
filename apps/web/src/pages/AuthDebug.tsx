import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Alert, Box, Button, Card, CardContent, Typography } from "@mui/material";

import { authStore } from "@/auth/authStore";
import { useAuth } from "@/contexts/AuthContext";
import type { User as UserType } from "@/contexts/AuthContext";
import NiArrowCircleLeft from "@/icons/nexture/ni-arrow-circle-left";
import NiArrowHistory from "@/icons/nexture/ni-arrow-history";
import NiArrowOutUp from "@/icons/nexture/ni-arrow-out-up";
import NiBug from "@/icons/nexture/ni-bug";
import api from "@/lib/api";

/** Decodifica payload do JWT sem validar (apenas para exibir exp/iat). */
function decodeJwtPayload(token: string): { exp?: number; iat?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const raw = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(raw) as { exp?: number; iat?: number };
  } catch {
    return null;
  }
}

export function AuthDebug() {
  const { user, logout, isAuthenticated, isVerifying } = useAuth();
  const navigate = useNavigate();
  const [meResult, setMeResult] = useState<{ ok: boolean; data?: UserType; error?: string } | null>(null);
  const [simulating, setSimulating] = useState(false);

  const accessToken = authStore.getAccessToken();
  const payload = accessToken ? decodeJwtPayload(accessToken) : null;
  const expDate = payload?.exp ? new Date(payload.exp * 1000) : null;
  const isExpired = expDate ? expDate.getTime() < Date.now() : null;

  useEffect(() => {
    if (!authStore.isAuthenticated() || isVerifying) {
      setMeResult(null);
      return;
    }
    setMeResult(null);
    api
      .get<UserType>("/auth/me")
      .then(({ data }) => setMeResult({ ok: true, data }))
      .catch((err: unknown) =>
        setMeResult({
          ok: false,
          error:
            (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ??
            (err as { message?: string })?.message ??
            "Erro ao chamar /auth/me",
        }),
      );
  }, [isVerifying, accessToken]);

  async function handleSimulateExpiry() {
    const refresh = authStore.getRefreshToken();
    if (!refresh) {
      setMeResult({ ok: false, error: "Sem refreshToken para testar." });
      return;
    }
    setSimulating(true);
    setMeResult(null);
    try {
      const { data } = await api.post<{ accessToken: string; refreshToken?: string }>("/auth/refresh", {
        refreshToken: refresh,
      });
      authStore.setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken ?? refresh,
      });
      const { data: meData } = await api.get<UserType>("/auth/me");
      setMeResult({ ok: true, data: meData });
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { message?: string } } })?.response;
      setMeResult({ ok: false, error: res?.data?.message ?? "Refresh falhou." });
    } finally {
      setSimulating(false);
    }
  }

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <Box>
      <Box className="mb-4 flex flex-row items-center justify-between">
        <Box className="flex items-center gap-2">
          <NiBug size={24} className="text-text-primary" />
          <Typography variant="h6" component="h1" className="text-text-primary">
            Debug de autenticação
          </Typography>
        </Box>
      </Box>

      {meResult && !meResult.ok && (
        <Alert severity="error" className="mb-4" onClose={() => setMeResult(null)}>
          {meResult.error}
        </Alert>
      )}

      <Card className="mb-4">
        <CardContent>
          <Typography variant="subtitle2" className="mb-2 font-semibold text-text-primary">
            Estado da sessão
          </Typography>
          <Box className="flex flex-col gap-1 text-sm">
            <Typography variant="body2" className="text-text-secondary">
              <strong>isAuthenticated:</strong> {String(isAuthenticated)}
            </Typography>
            <Typography variant="body2" className="text-text-secondary">
              <strong>isVerifying:</strong> {String(isVerifying)}
            </Typography>
            <Typography variant="body2" className="text-text-secondary">
              <strong>Token existe:</strong> {accessToken ? "Sim" : "Não"}
            </Typography>
            {payload && (
              <>
                <Typography variant="body2" className="text-text-secondary">
                  <strong>exp (token):</strong> {expDate?.toISOString() ?? "—"}{" "}
                  {isExpired !== null && (isExpired ? "(expirado)" : "(válido)")}
                </Typography>
                <Typography variant="body2" className="text-text-secondary">
                  <strong>iat:</strong> {payload.iat ? new Date(payload.iat * 1000).toISOString() : "—"}
                </Typography>
              </>
            )}
          </Box>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent>
          <Typography variant="subtitle2" className="mb-2 font-semibold text-text-primary">
            GET /auth/me
          </Typography>
          {meResult === null && authStore.isAuthenticated() && (
            <Typography variant="body2" className="text-text-secondary">
              Carregando…
            </Typography>
          )}
          {meResult?.ok && (
            <Box
              component="pre"
              className="max-h-48 overflow-auto rounded bg-grey-25 p-2 text-xs text-text-primary"
            >
              {JSON.stringify(meResult.data, null, 2)}
            </Box>
          )}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent>
          <Box className="flex flex-wrap gap-2">
            <Button
              variant="outlined"
              color="warning"
              size="medium"
              disabled={simulating || !authStore.getRefreshToken()}
              startIcon={<NiArrowHistory size="medium" />}
              onClick={handleSimulateExpiry}
            >
              {simulating ? "Testando…" : "Testar refresh (renova tokens)"}
            </Button>
            <Button
              variant="contained"
              color="grey"
              size="medium"
              startIcon={<NiArrowOutUp size="medium" />}
              onClick={handleLogout}
            >
              Logout
            </Button>
            <Button
              variant="outlined"
              color="grey"
              size="medium"
              component={Link}
              to="/dashboard"
              startIcon={<NiArrowCircleLeft size="medium" />}
            >
              Voltar ao painel
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Typography variant="body2" className="text-text-secondary">
        Usuário em memória: {user ? `${user.name} (${user.role})` : "—"}
      </Typography>
    </Box>
  );
}
