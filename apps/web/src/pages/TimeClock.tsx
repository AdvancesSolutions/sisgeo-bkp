import { useState } from "react";

import { Alert, Box, Button, Card, CardContent, Typography } from "@mui/material";

import NiArrowInDown from "@/icons/nexture/ni-arrow-in-down";
import NiArrowOutUp from "@/icons/nexture/ni-arrow-out-up";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useAuth } from "@/contexts/AuthContext";

export function TimeClock() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<"checkin" | "checkout" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCheckin = async () => {
    setError(null);
    setSuccess(null);
    setLoading("checkin");
    try {
      await api.post("/time-clock/checkin", {
        employeeId: (user as { employeeId?: string })?.employeeId ?? user?.id,
        type: "CHECKIN",
      });
      setSuccess("Check-in registrado.");
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Erro ao registrar check-in"));
    } finally {
      setLoading(null);
    }
  };

  const handleCheckout = async () => {
    setError(null);
    setSuccess(null);
    setLoading("checkout");
    try {
      await api.post("/time-clock/checkout", {
        employeeId: (user as { employeeId?: string })?.employeeId ?? user?.id,
        type: "CHECKOUT",
      });
      setSuccess("Check-out registrado.");
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Erro ao registrar check-out"));
    } finally {
      setLoading(null);
    }
  };

  return (
    <Box>
      <Box className="mb-4 flex flex-row items-center justify-between">
        <Typography variant="h6" component="h1" className="text-text-primary">
          Ponto (geolocalização)
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" className="mb-4" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" className="mb-4" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="body2" className="mb-4 text-text-secondary">
            Registre sua entrada e saída. A API registra check-in e check-out com suporte a geolocalização.
          </Typography>
          <Box className="flex flex-wrap gap-4">
            <Button
              variant="contained"
              color="success"
              size="medium"
              disabled={!!loading}
              startIcon={<NiArrowInDown size="medium" />}
              onClick={handleCheckin}
            >
              {loading === "checkin" ? "Registrando…" : "Check-in"}
            </Button>
            <Button
              variant="contained"
              color="error"
              size="medium"
              disabled={!!loading}
              startIcon={<NiArrowOutUp size="medium" />}
              onClick={handleCheckout}
            >
              {loading === "checkout" ? "Registrando…" : "Check-out"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
