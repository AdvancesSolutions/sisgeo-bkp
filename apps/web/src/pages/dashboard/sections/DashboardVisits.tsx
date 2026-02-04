import { useMemo, useState } from "react";

import { Box, Card, CardContent, FormControl, MenuItem, Select, Typography, useTheme } from "@mui/material";
import { type CurveType, LineChart } from "@mui/x-charts";

import CustomChartTooltip from "@/components/charts/tooltip/custom-chart-tooltip";
import NiChevronDownSmall from "@/icons/nexture/ni-chevron-down-small";

export default function DashboardVisits() {
  const theme = useTheme();
  const [curve, setCurve] = useState<CurveType>("bumpX");
  const [datePeriod, setDatePeriod] = useState<string>("lastWeek");

  const chartData = useMemo(() => {
    switch (datePeriod) {
      case "lastWeek":
        return {
          xAxis: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
          data: [2500, 3000, 2800, 3200, 3800, 3500, 3300],
        };
      case "lastMonth":
        return {
          xAxis: Array.from({ length: 4 }, (_, i) => `Sem ${i + 1}`),
          data: [11000, 12500, 11800, 13200],
        };
      case "lastQuarter":
        return {
          xAxis: ["Jan", "Fev", "Mar"],
          data: [42000, 45000, 43000],
        };
      case "lastYear":
        return {
          xAxis: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
          data: [41000, 42500, 44000, 45500, 44500, 43500, 45000, 46000, 44750, 43250, 41750, 42250],
        };
      default:
        return { xAxis: [] as string[], data: [] as number[] };
    }
  }, [datePeriod]);

  return (
    <Box>
      <Box className="mt-2 mb-3 flex flex-wrap justify-between gap-4">
        <Typography variant="h6" component="h6">
          Acessos
        </Typography>

        <Box className="-mt-1.5 flex gap-1">
          <FormControl size="small" variant="standard" className="outlined mb-0 w-34">
            <Select
              value={curve}
              onChange={(e) => setCurve(e.target.value as CurveType)}
              IconComponent={NiChevronDownSmall}
              MenuProps={{ className: "outlined" }}
              slotProps={{
                root: {
                  className: "[&>.MuiInputBase-input]:py-0! rounded-sm!",
                },
              }}
            >
              <MenuItem value="bumpX">Bump X</MenuItem>
              <MenuItem value="bumpY">Bump Y</MenuItem>
              <MenuItem value="catmullRom">Catmull Rom</MenuItem>
              <MenuItem value="linear">Linear</MenuItem>
              <MenuItem value="monotoneX">Monotone X</MenuItem>
              <MenuItem value="monotoneY">Monotone Y</MenuItem>
              <MenuItem value="natural">Natural</MenuItem>
              <MenuItem value="step">Step</MenuItem>
              <MenuItem value="stepAfter">Step After</MenuItem>
              <MenuItem value="stepBefore">Step Before</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" variant="standard" className="outlined mb-0 w-34">
            <Select
              value={datePeriod}
              onChange={(e) => setDatePeriod(e.target.value)}
              IconComponent={NiChevronDownSmall}
              MenuProps={{ className: "outlined" }}
              slotProps={{
                root: {
                  className: "[&>.MuiInputBase-input]:py-0! rounded-sm!",
                },
              }}
            >
              <MenuItem value="lastWeek">Última semana</MenuItem>
              <MenuItem value="lastMonth">Último mês</MenuItem>
              <MenuItem value="lastQuarter">Último trimestre</MenuItem>
              <MenuItem value="lastYear">Último ano</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Card>
        <CardContent>
          <LineChart
            xAxis={[{ data: chartData.xAxis, scaleType: "band", disableLine: true, disableTicks: true }]}
            yAxis={[
              {
                disableLine: true,
                disableTicks: true,
                min: chartData.data.length ? Math.min(...chartData.data) - 100 : 0,
                max: chartData.data.length ? Math.max(...chartData.data) + 100 : 100,
                width: 40,
                valueFormatter: (v: number | null) => {
                  if (typeof v !== "number") return "-";
                  return v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toLocaleString();
                },
              },
            ]}
            series={[{ curve, showMark: false, data: chartData.data, color: theme.palette.secondary.main }]}
            height={300}
            slots={{ tooltip: CustomChartTooltip }}
            grid={{ horizontal: true }}
            margin={{ bottom: 0, left: 0, right: 0 }}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
