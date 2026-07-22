import type { LineChartVariant } from "./lineChartExamples";
import { allLineChartVariants } from "./lineChartExamples";
import type { PieChartVariant } from "./pieChartExamples";
import type { BarChartVariant } from "./barChartExamples";
import { allBarChartVariants } from "./barChartExamples";

export type AnyChartVariant =
  | LineChartVariant
  | PieChartVariant
  | BarChartVariant;

export const allChartVariants: AnyChartVariant[] = [
  ...allLineChartVariants,
  ...allBarChartVariants,
];


