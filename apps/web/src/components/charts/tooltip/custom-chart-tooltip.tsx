import type { ChartsTooltipProps } from "@mui/x-charts";
import { ChartsTooltipContainer, ChartsTooltipPaper } from "@mui/x-charts";

import CustomChartTooltipContent from "@/components/charts/tooltip/custom-chart-tooltip-content";
import useChartTooltipData from "@/hooks/use-chart-tooltip-data";

export default function CustomChartTooltip(props: Readonly<ChartsTooltipProps>) {
  const { trigger, ...rest } = props;
  const hideTitle = "hideTitle" in rest ? (rest as { hideTitle?: boolean }).hideTitle : undefined;
  const tooltipData = useChartTooltipData(trigger);

  return (
    <CustomChartTooltipContent
      hideTitle={hideTitle}
      data={tooltipData}
      ContentContainer={ChartsTooltipContainer}
      ContentPaper={ChartsTooltipPaper}
      {...props}
    />
  );
}
