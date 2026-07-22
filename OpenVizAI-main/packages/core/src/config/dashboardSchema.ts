import { z } from "zod";
import { SUPPORTED_CHART_TYPES } from "@openvizai/shared-types";
import { ChartSpecSchema } from "../types/chartSpec.js";

const dashboardChartItemSchema = z.object({
  chart_type: z.enum(SUPPORTED_CHART_TYPES),
  meta: z.object({
    title: z.string(),
    subtitle: z.string().nullable(),
    query_explanation: z.string(),
  }),
  chartSpec: ChartSpecSchema,
});

export const dashboardResponseSchema = z.object({
  charts: z
    .array(dashboardChartItemSchema)
    .min(1)
    .max(5)
    .describe(
      "MUST return 1-5 chart objects. Each chart must use a DIFFERENT chart_type or different fields. Cover diverse aspects: trend, comparison, distribution.",
    ),
});
