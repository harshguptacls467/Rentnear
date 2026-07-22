import { z } from "zod";

type SharedChartType = "line" | "radar" | "bar" | "range_bar" | "pie" | "donut";

export const SERIES_VISUAL_TYPES = ["bar", "line", "area"] as const;
export type SeriesVisualType = (typeof SERIES_VISUAL_TYPES)[number];

export const COLOR_SEMANTICS = [
  "positive",
  "negative",
  "neutral",
  "warning",
  "caution",
  "target",
  "highlight",
  "missing",
  "forecast",
] as const;
export type ColorSemantic = (typeof COLOR_SEMANTICS)[number];

export const LINE_CURVES = ["smooth", "straight", "stepline"] as const;
export type LineCurve = (typeof LINE_CURVES)[number];

export const ChartSpecFieldSchema = z.object({
  field: z.string(),
  label: z.string(),
  unit: z.string().nullable(),
});

export const ChartSpecFieldWithTypeSchema = ChartSpecFieldSchema.extend({
  type: z.enum(SERIES_VISUAL_TYPES),
});

export type ChartSpecField = z.infer<typeof ChartSpecFieldSchema>;
export type ChartSpecFieldWithType = z.infer<
  typeof ChartSpecFieldWithTypeSchema
>;

export const ChartSpecSchema = z.object({
  x: z.array(ChartSpecFieldSchema).nullable(),
  y: z.array(ChartSpecFieldWithTypeSchema).nullable(),
  group: z.array(ChartSpecFieldSchema).nullable(),
  category: z.array(ChartSpecFieldSchema).nullable(),
  value: z.array(ChartSpecFieldSchema).nullable(),
  source: z.array(ChartSpecFieldSchema).nullable(),
  target: z.array(ChartSpecFieldSchema).nullable(),
  start: z.array(ChartSpecFieldSchema).nullable(),
  end: z.array(ChartSpecFieldSchema).nullable(),
  series: z.array(ChartSpecFieldSchema).nullable(),
  path: z.array(ChartSpecFieldSchema).nullable(),
  is_stacked: z.boolean(),
  is_horizontal: z.boolean(),
  isSemanticColors: z.boolean(),
  colorSemantic: z.enum(COLOR_SEMANTICS).nullable(),
  is_range: z.boolean().optional(),
  is_donut: z.boolean().optional(),
  line_curve: z.enum(LINE_CURVES).optional(),
  markers_size: z.number().optional(),
  forecast_points: z.number().optional(),
});

export type ChartSpec = z.infer<typeof ChartSpecSchema>;

export const ChartMetaSchema = z.object({
  title: z.string(),
  subtitle: z.string().nullable(),
  query_explanation: z.string(),
});

export type ChartMeta = z.infer<typeof ChartMetaSchema>;

export const ChartConfigSchema = z.object({
  chart_type: z.enum(["line", "radar", "bar", "range_bar", "pie", "donut"]),
  chartSpec: ChartSpecSchema,
});

export type ChartConfig = {
  chart_type: SharedChartType;
  chartSpec: ChartSpec;
};

export const SingleChartResultSchema = z.object({
  response_type: z.literal("graphical"),
  meta: ChartMetaSchema,
  chart: ChartConfigSchema,
});

export type SingleChartResult = {
  response_type: "graphical";
  meta: ChartMeta;
  chart: ChartConfig;
};

export const DashboardChartItemSchema = z.object({
  chart_type: z.enum(["line", "radar", "bar", "range_bar", "pie", "donut"]),
  meta: ChartMetaSchema,
  chartSpec: ChartSpecSchema,
});

export type DashboardChartItem = {
  chart_type: SharedChartType;
  meta: ChartMeta;
  chartSpec: ChartSpec;
};

export const DashboardResultSchema = z.object({
  response_type: z.literal("dashboard"),
  charts: z.array(DashboardChartItemSchema),
});

export type DashboardResult = {
  response_type: "dashboard";
  charts: DashboardChartItem[];
};
