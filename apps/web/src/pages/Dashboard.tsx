import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/pt";
import weekday from "dayjs/plugin/weekday";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Box,
  Breadcrumbs,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Tooltip,
  Typography,
} from "@mui/material";

import api from "@/lib/api";
import type { Location } from "@sigeo/shared";
import { Grid } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import NiCalendar from "@/icons/nexture/ni-calendar";
import NiCellsPlus from "@/icons/nexture/ni-cells-plus";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import DashboardBanner from "@/pages/dashboard/sections/DashboardBanner";
import DashboardActions from "@/pages/dashboard/sections/DashboardActions";
import DashboardStats from "@/pages/dashboard/sections/DashboardStats";
import DashboardKpis from "@/pages/dashboard/sections/DashboardKpis";
import DashboardLiveMonitoring from "@/pages/dashboard/sections/DashboardLiveMonitoring";
import DashboardPerformanceEvolution from "@/pages/dashboard/sections/DashboardPerformanceEvolution";
import DashboardRanking from "@/pages/dashboard/sections/DashboardRanking";
import DashboardRecentTasks from "@/pages/dashboard/sections/DashboardRecentTasks";
import DashboardActivity from "@/pages/dashboard/sections/DashboardActivity";
import DashboardAreasWithoutActivity from "@/pages/dashboard/sections/DashboardAreasWithoutActivity";
import DashboardTrainingCorrelation from "@/pages/dashboard/sections/DashboardTrainingCorrelation";
import DashboardSales from "@/pages/dashboard/sections/DashboardSales";
import DashboardVisits from "@/pages/dashboard/sections/DashboardVisits";

dayjs.extend(weekday);

export function Dashboard() {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState<Dayjs>(dayjs().weekday(-7));
  const [endDate, setEndDate] = useState<Dayjs>(dayjs().weekday(-1));
  const [locationId, setLocationId] = useState<string>("");
  const [locations, setLocations] = useState<Location[]>([]);
  const today = dayjs();

  const displayName = user?.name ?? "Usuário";

  useEffect(() => {
    api.get<{ data: Location[] }>("/locations").then(({ data }) => setLocations(data.data ?? []));
  }, []);

  return (
    <Grid container spacing={5}>
      <Grid container spacing={2.5} className="w-full" size={12}>
        <Grid size={{ xs: 12, md: "grow" }}>
          <Typography variant="h1" component="h1" className="mb-0">
            Bem-vindo, {displayName}!
          </Typography>
          <Breadcrumbs>
            <Link color="inherit" to="/dashboard">
              Início
            </Link>
            <Typography variant="body2">Dashboard</Typography>
          </Breadcrumbs>
        </Grid>

        <Grid size={{ xs: 12, md: "auto" }} className="flex flex-row flex-wrap items-start gap-2">
          <FormControl size="small" variant="outlined" sx={{ minWidth: 160 }}>
            <InputLabel>Unidade</InputLabel>
            <Select
              value={locationId}
              label="Unidade"
              onChange={(e) => setLocationId(e.target.value)}
            >
              <MenuItem value="">Todas</MenuItem>
              {locations.map((loc) => (
                <MenuItem key={loc.id} value={loc.id}>
                  {loc.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl variant="standard" className="surface-standard mb-0 w-full md:w-auto">
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt">
              <Box className="flex flex-row items-center gap-2">
                <DatePicker
                  label="Início"
                  value={startDate}
                  onChange={(v) => v && setStartDate(v)}
                  slots={{
                    openPickerIcon: (props) => (
                      <NiCalendar {...props} className={cn(props.className, "text-text-secondary")} />
                    ),
                  }}
                  slotProps={{
                    textField: { size: "small", variant: "standard" },
                    desktopPaper: { className: "outlined" },
                  }}
                />
                <Typography variant="body2" color="text.secondary">–</Typography>
                <DatePicker
                  label="Fim"
                  value={endDate}
                  onChange={(v) => v && setEndDate(v)}
                  slots={{
                    openPickerIcon: (props) => (
                      <NiCalendar {...props} className={cn(props.className, "text-text-secondary")} />
                    ),
                  }}
                  slotProps={{
                    textField: { size: "small", variant: "standard" },
                    desktopPaper: { className: "outlined" },
                  }}
                />
              </Box>
            </LocalizationProvider>
          </FormControl>
          <Tooltip title="Adicionar widget">
            <Button
              className="icon-only surface-standard flex-none"
              size="medium"
              color="grey"
              variant="surface"
              startIcon={<NiCellsPlus size={"medium"} />}
            />
          </Tooltip>
        </Grid>
      </Grid>

      <Grid container size={12}>
        <Grid size={{ lg: 8, xs: 12 }}>
          <DashboardBanner />
        </Grid>
        <Grid size={{ lg: 4, xs: 12 }}>
          <DashboardActions />
        </Grid>
      </Grid>

      <Grid container size={12}>
        <Grid size={{ lg: 8, xs: 12 }}>
          <Grid size={12} className="mb-5">
            <DashboardKpis />
          </Grid>
          <Grid size={12} className="mb-5">
            <DashboardLiveMonitoring />
          </Grid>
          <Grid size={12} className="mb-5">
            <DashboardPerformanceEvolution
              startDate={startDate}
              endDate={endDate}
              locationId={locationId || undefined}
            />
          </Grid>
          <Grid size={12} className="mb-5">
            <DashboardRanking
              date={today}
              locationId={locationId || undefined}
            />
          </Grid>
          <Grid size={12} className="mb-5">
            <DashboardStats />
          </Grid>
          <Grid size={12}>
            <DashboardRecentTasks />
          </Grid>
        </Grid>
        <Grid size={{ lg: 4, xs: 12 }}>
          <DashboardActivity />
          <div className="mt-5">
            <DashboardTrainingCorrelation />
          </div>
          <div className="mt-5">
            <DashboardAreasWithoutActivity startDate={startDate} endDate={endDate} />
          </div>
        </Grid>
      </Grid>

      <Grid container size={12}>
        <Grid size={{ lg: 6, xs: 12 }}>
          <DashboardSales />
        </Grid>
        <Grid size={{ lg: 6, xs: 12 }}>
          <DashboardVisits />
        </Grid>
      </Grid>
    </Grid>
  );
}
