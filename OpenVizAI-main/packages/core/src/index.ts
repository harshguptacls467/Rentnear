// Main entry point — single chart
export { analyzeChart } from "./analysis/analyzeChart.js";
export type { AnalyzeChartOptions } from "./analysis/analyzeChart.js";

// Dashboard — multi chart
export { analyzeDashboard } from "./analysis/analyzeDashboard.js";

// Schema validation
export { responseFormatterSchema } from "./config/zodSchemas.js";

// Schema inspection
export { inspectSchema } from "./analysis/schemaInspector.js";
export type { SchemaColumn, SchemaInfo } from "./analysis/schemaInspector.js";

// Post-LLM validation
export { validateChartSpecConsistency } from "./utils/chartSpecValidator.js";

// Prompt (for consumers who need the raw prompt template)
export { responseFormatterPrompt } from "./prompts/responseFormatterPrompt.js";

// Types
export type {
  ChartMeta,
  ChartResult,
  ChartType,
  AnalyzeChartConfig,
  AnalyzeChartInput,
  AnalyzeChartResult,
  ChartSpecField,
  ChartSpecFieldWithType,
  ChartSpec,
} from "./types/index.js";

export type {
  DashboardChartItem,
  DashboardResult,
  AnalyzeDashboardInput,
  AnalyzeDashboardResult,
} from "./types/dashboard.js";

// Errors
export {
  OpenVizAIError,
  InvalidInputError,
  LLMError,
  ConfigError,
} from "./errors/index.js";

// Re-export chart type constants
export { SUPPORTED_CHART_TYPES } from "@openvizai/shared-types";
