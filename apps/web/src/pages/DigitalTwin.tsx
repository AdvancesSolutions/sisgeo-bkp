import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import {
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";

import api from "@/lib/api";
import type { Location } from "@sigeo/shared";
import { DigitalTwinMap } from "@/components/DigitalTwinMap";
import { useAuth } from "@/contexts/AuthContext";

export function DigitalTwin() {
  const { user } = useAuth();
  const [locationId, setLocationId] = useState<string>("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    api.get<{ data: Location[] }>("/locations").then(({ data }) => {
      setLocations(data.data ?? []);
      if (data.data?.length && !locationId) {
        setLocationId(data.data[0].id);
      }
    });
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !locationId) return;
    setUploading(true);
    setUploadSuccess(false);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("floorNumber", "1");
      await api.post(`/digital-twin/floor-plan/${locationId}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadSuccess(true);
      setMapKey((k) => k + 1);
      setTimeout(() => setUploadSuccess(false), 3000);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid size={12}>
        <Typography variant="h1" component="h1" className="mb-0">
          Gêmeo Digital – Mapa de Calor
        </Typography>
        <Box className="mt-1 flex gap-2 text-sm text-slate-600">
          <Link color="inherit" to="/dashboard">
            Início
          </Link>
          <span>/</span>
          <Typography variant="body2" color="text.secondary">
            Visão espacial em tempo real
          </Typography>
        </Box>
      </Grid>

      <Grid size={12} className="flex flex-wrap items-center gap-4">
        <FormControl size="small" variant="outlined" sx={{ minWidth: 220 }}>
          <InputLabel>Unidade</InputLabel>
          <Select
            value={locationId}
            label="Unidade"
            onChange={(e) => setLocationId(e.target.value)}
          >
            <MenuItem value="">Selecione uma unidade</MenuItem>
            {locations.map((loc) => (
              <MenuItem key={loc.id} value={loc.id}>
                {loc.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {isAdmin && locationId && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              className="hidden"
              onChange={handleUpload}
            />
            <Button
              variant="outlined"
              size="small"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? "Enviando..." : "Upload planta baixa (PNG/SVG)"}
            </Button>
            {uploadSuccess && (
              <Typography variant="body2" color="success.main">
                Planta enviada com sucesso!
              </Typography>
            )}
          </>
        )}
      </Grid>

      <Grid size={12}>
        {locationId ? (
          <DigitalTwinMap key={mapKey} locationId={locationId} />
        ) : (
          <Box className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-slate-300">
            <Typography color="text.secondary">
              Selecione uma unidade para visualizar o mapa de calor
            </Typography>
          </Box>
        )}
      </Grid>
    </Grid>
  );
}
