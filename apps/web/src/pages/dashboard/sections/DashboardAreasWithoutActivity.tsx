import { useEffect, useState } from "react";

import { Card, CardContent, Typography } from "@mui/material";

import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useAuth } from "@/contexts/AuthContext";
import type { Area } from "@sigeo/shared";
import type { Dayjs } from "dayjs";
import { MapPinOff } from "lucide-react";

type Props = { startDate: Dayjs; endDate: Dayjs };

export default function DashboardAreasWithoutActivity({ startDate, endDate }: Props) {
  const { user } = useAuth();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== "ADMIN" && user?.role !== "SUPERVISOR") {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .get<Area[]>("/areas/without-activity", {
        params: {
          from: startDate.startOf("day").toISOString(),
          to: endDate.endOf("day").toISOString(),
        },
      })
      .then((res) => {
        if (!cancelled) setAreas(Array.isArray(res.data) ? res.data : []);
      })
      .catch((e) => {
        if (!cancelled) setError(getApiErrorMessage(e, "Erro ao carregar áreas sem atividade"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.role, startDate, endDate]);

  if (user?.role !== "ADMIN" && user?.role !== "SUPERVISOR") return null;

  return (
    <>
      <Typography variant="h6" component="h6" className="mt-2 mb-3">
        Áreas sem atividade no período
      </Typography>
      <Card>
        <CardContent>
          {loading && (
            <Typography variant="body2" className="text-text-secondary">
              Carregando…
            </Typography>
          )}
          {error && (
            <Typography variant="body2" className="text-error">
              {error}
            </Typography>
          )}
          {!loading && !error && areas.length === 0 && (
            <Typography variant="body2" className="text-text-secondary">
              Nenhuma área sem atividade no período.
            </Typography>
          )}
          {!loading && !error && areas.length > 0 && (
            <>
              <ul className="list-inside list-disc space-y-1 text-text-secondary">
                {areas.map((a) => (
                  <li key={a.id}>
                    <span className="text-text-primary">{a.name}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex items-center gap-1 text-text-disabled">
                <MapPinOff className="h-4 w-4" />
                <Typography variant="caption">
                  {areas.length} área(s) sem nenhuma tarefa entre{" "}
                  {startDate.format("DD/MM/YYYY")} e {endDate.format("DD/MM/YYYY")}.
                </Typography>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
