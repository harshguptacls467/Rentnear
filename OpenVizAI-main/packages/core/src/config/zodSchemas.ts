import { z } from "zod";
import { SUPPORTED_CHART_TYPES } from "@openvizai/shared-types";
import {
  ChartSpecFieldSchema,
  ChartSpecFieldWithTypeSchema,
  ChartSpecSchema,
} from "../types/chartSpec.js";

export { ChartSpecFieldSchema, ChartSpecFieldWithTypeSchema, ChartSpecSchema };

/**
 * Zod schema that validates the full LLM response for a single chart.
 *
 * Use this to validate or type-narrow raw JSON from an LLM before
 * passing it through the rest of the pipeline.
 *
 * @example
 * ```ts
 * import { responseFormatterSchema } from "@openvizai/core";
 *
 * const parsed = responseFormatterSchema.parse(llmJson);
 * // parsed is fully typed as { response_type, meta, chart }
 * ```
 */
export const responseFormatterSchema = z.object({
  response_type: z.literal("graphical"),
  meta: z.object({
    title: z.string(),
    subtitle: z.string().nullable(),
    query_explanation: z.string(),
  }),
  chart: z.object({
    chart_type: z.enum(SUPPORTED_CHART_TYPES),
    chartSpec: ChartSpecSchema,
  }),
});
