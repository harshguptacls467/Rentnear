import type { BaseMessage } from "@langchain/core/messages";
import type { AnalyzeChartInput, AnalyzeChartResult } from "../types/api.js";
import { resolveConfig } from "../config/defaults.js";
import { sampleDataset } from "./datasetSampler.js";
import { formatData } from "../utils/formatData.js";
import { generateChartSpec } from "../agents/chartSpecGeneratorAgent.js";
import { validateInput } from "../utils/validation.js";
import { inspectSchema } from "./schemaInspector.js";
import { validateChartSpecConsistency } from "../utils/chartSpecValidator.js";

/**
 * Extended input for {@link analyzeChart} — adds optional chat history
 * on top of the base {@link AnalyzeChartInput}.
 */
export interface AnalyzeChartOptions extends AnalyzeChartInput {
  /** Optional chat history for multi-turn conversation context. */
  chatHistory?: BaseMessage[];
}

/**
 * Analyze a user prompt and dataset to produce a single chart recommendation.
 *
 * Returns the best-fit chart type, field-level chartSpec (x/y/category/value mappings),
 * and human-readable metadata (title, subtitle, explanation).
 *
 * This is the main entry point for the `@openvizai/core` package.
 *
 * @param input - The prompt, dataset rows, and optional LLM config.
 * @returns A promise that resolves to `{ result, sampleUsed }`.
 *
 * @example
 * ```ts
 * import { analyzeChart } from "@openvizai/core";
 *
 * const { result, sampleUsed } = await analyzeChart({
 *   prompt: "show revenue trends over time",
 *   data: [
 *     { date: "2023-01-01", revenue: 1000 },
 *     { date: "2023-02-01", revenue: 1500 },
 *   ],
 *   config: { provider: "google", apiKey: process.env.GEMINI_API_KEY },
 * });
 *
 * console.log(result.chart.chart_type); // "line"
 * console.log(result.chart.chartSpec);  // { x: [...], y: [...], ... }
 * ```
 *
 * @throws {InvalidInputError} If `prompt` or `data` is missing/invalid.
 * @throws {LLMError} If the LLM call fails or returns unparseable output.
 * @throws {ConfigError} If the provider config is invalid.
 */
export async function analyzeChart(
  input: AnalyzeChartOptions,
): Promise<AnalyzeChartResult> {
  // 1. Validate input
  validateInput(input);

  // 2. Resolve config (merge user config with defaults)
  const config = resolveConfig(input.config);

  // 3. Sample dataset
  const sampleUsed = sampleDataset(input.data, config.sampleRows);

  // 4. Inspect schema for column type hints
  const schema = inspectSchema(sampleUsed);

  // 5. Format sample into tabular structure for LLM
  const sampleData = formatData(sampleUsed);

  // 6. Call LLM to generate chartSpec
  const result = await generateChartSpec({
    prompt: input.prompt,
    sampleData,
    config,
    chatHistory: input.chatHistory,
    schema,
  });

  // 7. Post-LLM validation: ensure chart_type matches filled chartSpec fields
  const validated = validateChartSpecConsistency(result);

  // 8. Return result
  return { result: validated, sampleUsed };
}
