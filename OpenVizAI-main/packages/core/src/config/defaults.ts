import type { AnalyzeChartConfig } from "../types/api.js";

export interface ResolvedConfig {
  provider: "openai" | "google";
  apiKey: string;
  model: string;
  sampleRows: number;
}

export const DEFAULT_CONFIG = {
  provider: "google",
  openaiModel: "gpt-4.1-mini",
  googleModel: "gemini-3-flash-preview",
  sampleRows: 3,
} as const;

export function resolveConfig(config?: AnalyzeChartConfig): ResolvedConfig {
  const provider = config?.provider ?? DEFAULT_CONFIG.provider;

  const apiKey = config?.apiKey
    ? config.apiKey
    : provider === "openai"
      ? process.env.OPENAI_API_KEY
      : process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "API key is required. Provide it via config.apiKey or the OPENAI_API_KEY or GEMINI_API_KEY environment variable.",
    );
  }

  const model =
    config?.model ??
    (provider === "openai"
      ? DEFAULT_CONFIG.openaiModel
      : DEFAULT_CONFIG.googleModel);

  return {
    provider,
    apiKey,
    model,
    sampleRows: config?.sampleRows ?? DEFAULT_CONFIG.sampleRows,
  };
}
