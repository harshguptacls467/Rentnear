import type { ChartResult } from "./chart.js";

/**
 * Configuration for the LLM provider used by `analyzeChart` and `analyzeDashboard`.
 *
 * @example
 * ```ts
 * const config: AnalyzeChartConfig = {
 *   provider: "google",
 *   apiKey: process.env.GEMINI_API_KEY,
 *   model: "gemini-2.0-flash",
 *   sampleRows: 50,
 * };
 * ```
 */
export interface AnalyzeChartConfig {
  /** LLM provider — `"openai"` or `"google"` (Google Gemini). */
  provider?: "openai" | "google";
  /** API key for the chosen provider. */
  apiKey?: string;
  /** Model name override (e.g. `"gpt-4o"`, `"gemini-2.0-flash"`). Uses provider default if omitted. */
  model?: string;
  /** Max number of dataset rows sent to the LLM. Defaults to `100`. */
  sampleRows?: number;
}

/**
 * Input for {@link analyzeChart}.
 *
 * @example
 * ```ts
 * const input: AnalyzeChartInput = {
 *   prompt: "show revenue trends over time",
 *   data: [{ date: "2023-01-01", revenue: 1000 }, ...],
 *   config: { provider: "google", apiKey: "..." },
 * };
 * ```
 */
export interface AnalyzeChartInput {
  /** Natural-language prompt describing the desired visualization. */
  prompt: string;
  /** Array of data objects (rows) to visualize. */
  data: Record<string, unknown>[];
  /** Optional LLM provider configuration. */
  config?: AnalyzeChartConfig;
}

/**
 * Return type of {@link analyzeChart}.
 *
 * Contains the full chart result (type, chartSpec, metadata) and the
 * subset of rows that were actually sent to the LLM.
 */
export interface AnalyzeChartResult {
  /** The chart result including chart_type, chartSpec, and meta. */
  result: ChartResult;
  /** The sampled rows that were sent to the LLM. */
  sampleUsed: Record<string, unknown>[];
}
