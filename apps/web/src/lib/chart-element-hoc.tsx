import type { ComponentType } from "react";

import type { BarElementProps, PieArcProps, ScatterMarkerProps } from "@mui/x-charts";

type ChartElementType = BarElementProps | PieArcProps | ScatterMarkerProps;

import { colorWithOpacity } from "./chart-helper";

export const withChartElementStyle = <T extends ChartElementType>(
  Component: ComponentType<T>,
  additionalProps: Partial<T> = {}
) =>
  function ChartElement(props: T) {
    const { color, ...other } = props;
    const fillColor = colorWithOpacity(color);

    const componentProps = {
      ...other,
      ...additionalProps,
      style: { ...("style" in props ? props.style : {}), stroke: color, strokeWidth: 2, fill: fillColor },
      color,
    } as T;

    return <Component {...componentProps} />;
  };
