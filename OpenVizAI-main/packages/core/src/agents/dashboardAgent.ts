import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { dashboardPlannerPrompt } from "../prompts/dashboardPlannerPrompt.js";
import { dashboardResponseSchema } from "../config/dashboardSchema.js";
import { LLMError } from "../errors/index.js";
import type { ResolvedConfig } from "../config/defaults.js";
import type { DashboardChartItem } from "../types/dashboard.js";
import type { SchemaInfo } from "../analysis/schemaInspector.js";
import type { ChartType } from "@openvizai/shared-types";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { dashboardResponseSchemaRaw } from "../config/JsonSchemas.js";

export interface GenerateDashboardChartSpecsOptions {
  prompt: string;
  sampleData: { columns: string[]; rows: string[][] };
  config: ResolvedConfig;
  schema?: SchemaInfo;
  charts?: ChartType[];
  maxCharts?: number;
}

export async function generateDashboardChartSpecs(
  options: GenerateDashboardChartSpecsOptions,
): Promise<DashboardChartItem[]> {
  const { prompt, sampleData, config, schema, charts, maxCharts } = options;

  try {
    let model: ChatOpenAI | ChatGoogleGenerativeAI;

    switch (config.provider) {
      case "google":
        model = new ChatGoogleGenerativeAI({
          apiKey: config.apiKey,
          model: config.model,
        });
        break;
      default:
        model = new ChatOpenAI({
          apiKey: config.apiKey,
          model: config.model,
        });
        break;
    }

    const systemMessage = new SystemMessage(
      dashboardPlannerPrompt(prompt, sampleData, schema, charts, maxCharts),
    );

    const humanMessage = new HumanMessage("Generate the dashboard plan.");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const structuredModel = (model as any).withStructuredOutput(
      config.provider === "openai"
        ? dashboardResponseSchema
        : dashboardResponseSchemaRaw,
    );
    const response = await structuredModel.invoke([
      systemMessage,
      humanMessage,
    ]);
    return (response as { charts: DashboardChartItem[] }).charts;
  } catch (err) {
    if (err instanceof LLMError) throw err;
    throw new LLMError(
      `Failed to generate dashboard chart specs: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
