import type { ChartType } from "@openvizai/shared-types";

type EmbeddingField = {
  field: string;
  label: string;
  unit?: string | null;
};

export type PieChartEmbedding = {
  // Field name in rows that contains the category/label
  category: EmbeddingField[];
  // Field name in rows that contains the numeric value
  value: EmbeddingField[];
  // Whether to render as donut instead of pie
  is_donut?: boolean;
};

export type PieGraphicalMeta = {
  title: string;
  subtitle: string | null;
  query_explanation: string | null;
};

export type PieGraphicalChart = {
  chart_type: Extract<ChartType, "pie" | "donut">;
  embedding: PieChartEmbedding;
};

export type PieGraphicalResult = {
  response_type: "graphical";
  meta: PieGraphicalMeta;
  chart: PieGraphicalChart;
};

export type PieChartVariant = {
  id: string;
  label: string;
  result: PieGraphicalResult;
  rows: Record<string, string | number>[];
};
