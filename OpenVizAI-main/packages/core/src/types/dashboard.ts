import type { ChartType } from "@openvizai/shared-types";
import type { ChartSpec } from "./chartSpec.js";
import type { ChartMeta } from "./chart.js";
import type { AnalyzeChartConfig } from "./api.js";

/**
 * A single chart item within a dashboard result.
 *
 * Each item has its own chart type, chartSpec, and metadata.
 * Pass directly to `<OpenVizRenderer />` to render.
 */
export interface DashboardChartItem {
  /** Which chart type this item uses (e.g. `"bar"`, `"line"`, `"pie"`). */
  chart_type: ChartType;
  /** Full chartSpec ready for `<OpenVizRenderer />`. */
  chartSpec: ChartSpec;
  /** Title / subtitle / explanation for this specific chart. */
  meta: ChartMeta;
}

/**
 * Complete dashboard result containing multiple chart items.
 */
export interface DashboardResult {
  /** Always `"dashboard"` for multi-chart results. */
  response_type: "dashboard";
  /** Array of chart items — each is a standalone chart config. */
  charts: DashboardChartItem[];
}

/**
 * Input for {@link analyzeDashboard}.
 *
 * @example
 * ```ts
 * const input: AnalyzeDashboardInput = {
 *   prompt: "full overview of sales performance",
 *   data: salesRows,
 *   config: { provider: "google", apiKey: "..." },
 *   maxCharts: 4,
 * };
 * ```
 */
export interface AnalyzeDashboardInput {
  /** Natural-language prompt describing the desired dashboard. */
  prompt: string;
  /** Array of data objects (rows) to visualize. */
  data: Record<string, unknown>[];
  /** Optional LLM provider configuration. */
  config?: AnalyzeChartConfig;
  /** Optional: restrict to specific chart types. If omitted, the LLM decides. */
  charts?: ChartType[];
  /** Optional: max number of charts. If omitted, the LLM decides (capped at 6). */
  maxCharts?: number;
}

/**
 * Return type of {@link analyzeDashboard}.
 */
export interface AnalyzeDashboardResult {
  /** The dashboard result with its chart items. */
  result: DashboardResult;
  /** The sampled rows that were sent to the LLM. */
  sampleUsed: Record<string, unknown>[];
}
