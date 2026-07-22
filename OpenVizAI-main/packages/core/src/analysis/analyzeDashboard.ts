import type {
  AnalyzeDashboardInput,
  AnalyzeDashboardResult,
  DashboardChartItem,
} from "../types/dashboard.js";
import { resolveConfig } from "../config/defaults.js";
import { sampleDataset } from "./datasetSampler.js";
import { formatData } from "../utils/formatData.js";
import { validateInput } from "../utils/validation.js";
import { inspectSchema } from "./schemaInspector.js";
import { validateChartSpecConsistency } from "../utils/chartSpecValidator.js";
import { generateDashboardChartSpecs } from "../agents/dashboardAgent.js";

/**
 * Analyze a user prompt and dataset to produce multiple chart recommendations for a dashboard.
 *
 * Returns an array of chart items, each with its own chart type, chartSpec, and metadata.
 * Uses a single LLM call to generate all charts at once.
 *
 * @param input - The prompt, dataset rows, optional LLM config, and dashboard constraints.
 * @returns A promise that resolves to `{ result, sampleUsed }` where `result.charts` is the array.
 *
 * @example
 * ```ts
 * import { analyzeDashboard } from "@openvizai/core";
 *
 * const { result } = await analyzeDashboard({
 *   prompt: "give me a full overview of energy usage",
 *   data: rows,
 *   config: { provider: "google", apiKey: process.env.GEMINI_API_KEY },
 *   maxCharts: 4,
 * });
 *
 * result.charts.forEach(chart => {
 *   console.log(chart.chart_type, chart.meta.title);
 * });
 * ```
 *
 * @throws {InvalidInputError} If `prompt` or `data` is missing/invalid.
 * @throws {LLMError} If the LLM call fails or returns unparseable output.
 * @throws {ConfigError} If the provider config is invalid.
 */
export async function analyzeDashboard(
  input: AnalyzeDashboardInput,
): Promise<AnalyzeDashboardResult> {
  // 1. Validate input (same validation as single chart)
  validateInput(input);

  // 2. Resolve config — use a stronger model for dashboard (multi-chart output)
  const config = resolveConfig(input.config);

  // 3. Sample dataset
  const sampleUsed = sampleDataset(input.data, config.sampleRows);

  // 4. Inspect schema
  const schema = inspectSchema(sampleUsed);

  // 5. Format for LLM
  const sampleData = formatData(sampleUsed);

  // 6. Call LLM — single call that returns multiple chart configs
  const charts = await generateDashboardChartSpecs({
    prompt: input.prompt,
    sampleData,
    config,
    schema,
    charts: input.charts,
    maxCharts: input.maxCharts,
  });

  // 7. Post-LLM validation on each chart item
  const validatedCharts: DashboardChartItem[] = charts.map((item) => {
    const validated = validateChartSpecConsistency({
      response_type: "graphical",
      meta: item.meta,
      chart: { chart_type: item.chart_type, chartSpec: item.chartSpec },
    });
    return {
      chart_type: validated.chart.chart_type,
      chartSpec: validated.chart.chartSpec,
      meta: validated.meta,
    };
  });

  return {
    result: {
      response_type: "dashboard",
      charts: validatedCharts,
    },
    sampleUsed,
  };
}
