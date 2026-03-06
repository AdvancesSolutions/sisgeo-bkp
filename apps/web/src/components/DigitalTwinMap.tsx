import { useCallback, useEffect, useRef, useState } from "react";

import {
  Box,
  FormControlLabel,
  Popover,
  Switch,
  Typography,
} from "@mui/material";

import api from "@/lib/api";
import { createDigitalTwinSocket } from "@/lib/socket";

export type HygieneStatus = "GREEN" | "YELLOW" | "RED" | "CRITICAL";

export interface ZoneWithStatus {
  zoneId: string;
  areaId: string;
  areaName: string;
  polygon: { x: number; y: number }[];
  status: HygieneStatus;
  lastCleanAt: string | null;
  hoursSinceLastClean: number | null;
  findMeScore: number | null;
  lastEmployeeName: string | null;
  hasOpenOccurrence: boolean;
}

export interface DigitalTwinStatus {
  locationId: string;
  floorPlan: {
    id: string;
    imageUrl: string;
    width: number | null;
    height: number | null;
    floorNumber: number;
  } | null;
  zones: ZoneWithStatus[];
  openOccurrences: { areaId: string; type: string }[];
  ativosStatus: { id: string; nome: string; status: string }[];
}

const STATUS_COLORS: Record<HygieneStatus, string> = {
  GREEN: "rgba(34, 197, 94, 0.6)",
  YELLOW: "rgba(234, 179, 8, 0.6)",
  RED: "rgba(239, 68, 68, 0.6)",
  CRITICAL: "rgba(220, 38, 38, 0.8)",
};

function formatHoursSince(hours: number | null): string {
  if (hours == null) return "—";
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  return `${hours.toFixed(1)} h`;
}

interface DigitalTwinMapProps {
  locationId: string;
  floorNumber?: number;
}

export function DigitalTwinMap({ locationId, floorNumber = 1 }: DigitalTwinMapProps) {
  const [data, setData] = useState<DigitalTwinStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [hoveredZone, setHoveredZone] = useState<ZoneWithStatus | null>(null);
  const [showOccurrencesOnly, setShowOccurrencesOnly] = useState(false);
  const [showAtivosOnly, setShowAtivosOnly] = useState(false);
  const socketRef = useRef<ReturnType<typeof createDigitalTwinSocket> | null>(null);

  const loadStatus = useCallback(async () => {
    if (!locationId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        floor: String(floorNumber),
        includeAtivos: "true",
        includeOccurrences: "true",
      });
      const res = await api.get<DigitalTwinStatus>(
        `/digital-twin/status/${locationId}?${params}`
      );
      setData(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar mapa");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [locationId, floorNumber]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (!locationId) return;
    const socket = createDigitalTwinSocket();
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-location", { locationId });
    });

    socket.on("digital-twin:area-updated", (payload: { areaId: string; locationId: string }) => {
      if (payload.locationId === locationId) {
        loadStatus();
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [locationId, loadStatus]);

  const handleZoneMouseEnter = (e: React.MouseEvent, zone: ZoneWithStatus) => {
    setHoveredZone(zone);
    setAnchorEl(e.currentTarget as HTMLElement);
  };

  const handleZoneMouseLeave = () => {
    setHoveredZone(null);
    setAnchorEl(null);
  };

  const getImageUrl = (url: string) => {
    if (url.startsWith("http")) return url;
    const base = import.meta.env.VITE_API_URL || "";
    if (base && !base.startsWith("http")) return `${window.location.origin}${url}`;
    return url;
  };

  const filteredZones = data?.zones?.filter((z) => {
    if (showOccurrencesOnly && !z.hasOpenOccurrence) return false;
    return true;
  }) ?? [];

  if (loading) {
    return (
      <Box className="flex h-96 items-center justify-center rounded-lg bg-slate-100">
        <Typography color="text.secondary">Carregando mapa...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="flex h-48 items-center justify-center rounded-lg bg-red-50">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!data?.floorPlan) {
    return (
      <Box className="flex h-96 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-4">
        <Typography color="text.secondary">
          Nenhuma planta baixa cadastrada para esta unidade.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          O administrador pode fazer upload em Configurações → Digital Twin.
        </Typography>
      </Box>
    );
  }

  const imgUrl = getImageUrl(data.floorPlan.imageUrl);

  return (
    <Box className="relative w-full">
      <Box className="mb-2 flex flex-wrap gap-4">
        <FormControlLabel
          control={
            <Switch
              checked={showOccurrencesOnly}
              onChange={(e) => setShowOccurrencesOnly(e.target.checked)}
              size="small"
            />
          }
          label="Apenas ocorrências abertas"
        />
        <FormControlLabel
          control={
            <Switch
              checked={showAtivosOnly}
              onChange={(e) => setShowAtivosOnly(e.target.checked)}
              size="small"
            />
          }
          label="Status de equipamentos"
        />
      </Box>

      <Box className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
        <Box className="relative" sx={{ aspectRatio: "16/10", minHeight: 400 }}>
          <img
            src={imgUrl}
            alt="Planta baixa"
            className="absolute inset-0 h-full w-full object-contain"
            style={{ maxHeight: "70vh" }}
          />
          <svg
            className="absolute inset-0 h-full w-full cursor-pointer"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {filteredZones.map((zone) => {
              const points = zone.polygon
                .map((p) => `${p.x},${p.y}`)
                .join(" ");
              const isCritical = zone.status === "CRITICAL";
              return (
                <polygon
                  key={zone.zoneId}
                  points={points}
                  fill={STATUS_COLORS[zone.status]}
                  stroke="rgba(0,0,0,0.3)"
                  strokeWidth={0.5}
                  className="transition-opacity hover:opacity-90"
                  style={{
                    animation: isCritical ? "pulse 1.5s ease-in-out infinite" : undefined,
                  }}
                  onMouseEnter={(e) => handleZoneMouseEnter(e, zone)}
                  onMouseLeave={handleZoneMouseLeave}
                />
              );
            })}
          </svg>
        </Box>
      </Box>

      <Box className="mt-2 flex flex-wrap gap-4">
        <Box className="flex items-center gap-2">
          <Box
            className="h-4 w-4 rounded"
            style={{ backgroundColor: STATUS_COLORS.GREEN }}
          />
          <Typography variant="caption">&lt; 2h limpo</Typography>
        </Box>
        <Box className="flex items-center gap-2">
          <Box
            className="h-4 w-4 rounded"
            style={{ backgroundColor: STATUS_COLORS.YELLOW }}
          />
          <Typography variant="caption">2h–4h</Typography>
        </Box>
        <Box className="flex items-center gap-2">
          <Box
            className="h-4 w-4 rounded"
            style={{ backgroundColor: STATUS_COLORS.RED }}
          />
          <Typography variant="caption">&gt; 4h ou atrasado</Typography>
        </Box>
        <Box className="flex items-center gap-2">
          <Box
            className="h-4 w-4 rounded animate-pulse"
            style={{ backgroundColor: STATUS_COLORS.CRITICAL }}
          />
          <Typography variant="caption">Ocorrência crítica</Typography>
        </Box>
      </Box>

      <Popover
        open={!!anchorEl}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        onClose={handleZoneMouseLeave}
        disableRestoreFocus
        sx={{ pointerEvents: "none" }}
      >
        {hoveredZone && (
          <Box className="max-w-xs p-3" sx={{ pointerEvents: "auto" }}>
            <Typography variant="subtitle2" fontWeight="bold">
              {hoveredZone.areaName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Último colaborador: {hoveredZone.lastEmployeeName ?? "—"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              FindMe Score: {hoveredZone.findMeScore ?? "—"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tempo desde última limpeza:{" "}
              {formatHoursSince(hoveredZone.hoursSinceLastClean)}
            </Typography>
            {hoveredZone.hasOpenOccurrence && (
              <Typography variant="caption" color="error" fontWeight="medium">
                Ocorrência aberta
              </Typography>
            )}
          </Box>
        )}
      </Popover>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </Box>
  );
}
