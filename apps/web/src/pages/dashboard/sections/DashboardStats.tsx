import dayjs from "dayjs";
import "dayjs/locale/pt";

import { Box, Card, CardContent, Grid, Typography, useTheme } from "@mui/material";
import { SparkLineChart } from "@mui/x-charts";

import useHighlightedSparkline from "@/hooks/use-highlighted-sparkline";
import NiTriangleDown from "@/icons/nexture/ni-triangle-down";
import NiTriangleUp from "@/icons/nexture/ni-triangle-up";

const tarefasData = [60, 140, 140, 140, 220, 340, 340, 100, 60, 60, 340];
const validacaoData = [40, 70, 70, 210, 140, 70, 163];
const funcionariosData = [120, 300, 300, 500, 700, 750, 750, 500, 350, 200, 742];
const materiaisData = [50, 240, 120, 130, 200, 110, 182];

export default function DashboardStats() {
  const { palette } = useTheme();

  const tarefasSparkline = useHighlightedSparkline({
    data: tarefasData,
    plotType: "line",
    color: palette.primary.main,
  });
  const validacaoSparkline = useHighlightedSparkline({
    data: validacaoData,
    plotType: "bar",
    color: palette.secondary.main,
  });
  const funcionariosSparkline = useHighlightedSparkline({
    data: funcionariosData,
    plotType: "line",
    color: palette.primary.main,
  });
  const materiaisSparkline = useHighlightedSparkline({
    data: materiaisData,
    plotType: "bar",
    color: palette.secondary.main,
  });

  return (
    <>
      <Typography variant="h6" component="h6" className="mt-2 mb-3">
        Resumo
      </Typography>

      <Grid size={{ xs: 12 }} container spacing={2.5}>
        <Grid size={{ lg: 3, md: 6, xs: 12 }}>
          <Card>
            <CardContent className="flex flex-col gap-5">
              <Box className="flex flex-col">
                <Typography variant="body1" className="text-text-secondary-dark text-nowrap">
                  Tarefas
                  <Typography variant="body1" component="span" className="text-text-secondary-light">
                    {" - "}
                    {dayjs()
                      .locale("pt")
                      .subtract(tarefasSparkline.props.data.length - tarefasSparkline.item.index - 1, "day")
                      .format("ddd")}
                  </Typography>
                </Typography>
                <Box className="flex flex-row items-center justify-start gap-2 lg:justify-between lg:gap-0">
                  <Typography variant="h5" className="text-text-primary">
                    {tarefasSparkline.item.value}
                  </Typography>
                  <ChangeStatus change={tarefasSparkline.item.change} />
                </Box>
              </Box>
              <SparkLineChart {...tarefasSparkline.props} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ lg: 3, md: 6, xs: 12 }}>
          <Card>
            <CardContent className="flex flex-col gap-5">
              <Box className="flex flex-col">
                <Typography variant="body1" className="text-text-secondary-dark text-nowrap">
                  Em validação
                  <Typography variant="body1" component="span" className="text-text-secondary-light">
                    {" - "}
                    {dayjs()
                      .locale("pt")
                      .subtract(validacaoSparkline.props.data.length - validacaoSparkline.item.index - 1, "day")
                      .format("ddd")}
                  </Typography>
                </Typography>
                <Box className="flex flex-row items-center justify-start gap-2 lg:justify-between lg:gap-0">
                  <Typography variant="h5" className="text-text-primary">
                    {validacaoSparkline.item.value}
                  </Typography>
                  <ChangeStatus change={validacaoSparkline.item.change} />
                </Box>
              </Box>
              <SparkLineChart {...validacaoSparkline.props} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ lg: 3, md: 6, xs: 12 }}>
          <Card>
            <CardContent className="flex flex-col gap-5">
              <Box className="flex flex-col">
                <Typography variant="body1" className="text-text-secondary-dark text-nowrap">
                  Funcionários
                  <Typography variant="body1" component="span" className="text-text-secondary-light">
                    {" - "}
                    {dayjs()
                      .locale("pt")
                      .subtract(funcionariosSparkline.props.data.length - funcionariosSparkline.item.index - 1, "day")
                      .format("ddd")}
                  </Typography>
                </Typography>
                <Box className="flex flex-row items-center justify-start gap-2 lg:justify-between lg:gap-0">
                  <Typography variant="h5" className="text-text-primary">
                    {funcionariosSparkline.item.value}
                  </Typography>
                  <ChangeStatus change={funcionariosSparkline.item.change} />
                </Box>
              </Box>
              <SparkLineChart {...funcionariosSparkline.props} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ lg: 3, md: 6, xs: 12 }}>
          <Card>
            <CardContent className="flex flex-col gap-5">
              <Box className="flex flex-col">
                <Typography variant="body1" className="text-text-secondary-dark text-nowrap">
                  Materiais
                  <Typography variant="body1" component="span" className="text-text-secondary-light">
                    {" - "}
                    {dayjs()
                      .locale("pt")
                      .subtract(materiaisSparkline.props.data.length - materiaisSparkline.item.index - 1, "day")
                      .format("ddd")}
                  </Typography>
                </Typography>
                <Box className="flex flex-row items-center justify-start gap-2 lg:justify-between lg:gap-0">
                  <Typography variant="h5" className="text-text-primary">
                    {materiaisSparkline.item.value}
                  </Typography>
                  <ChangeStatus change={materiaisSparkline.item.change} />
                </Box>
              </Box>
              <SparkLineChart {...materiaisSparkline.props} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}

function ChangeStatus({ change }: { change: number | string }) {
  return (
    <Box className="flex">
      {Number(change) < 0 ? (
        <NiTriangleDown size="tiny" className={"text-error"} />
      ) : (
        <NiTriangleUp size="tiny" className="text-success" />
      )}
      <Typography variant="body2" className={Number(change) < 0 ? "text-error" : "text-success"}>
        {Math.abs(Number(change))}%
      </Typography>
    </Box>
  );
}
