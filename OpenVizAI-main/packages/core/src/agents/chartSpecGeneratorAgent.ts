import { ChatOpenAI } from "@langchain/openai";
import {
  HumanMessage,
  SystemMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { responseFormatterPrompt } from "../prompts/responseFormatterPrompt.js";
import { responseFormatterSchema } from "../config/zodSchemas.js";
import { LLMError } from "../errors/index.js";
import type { ResolvedConfig } from "../config/defaults.js";
import type { ChartResult } from "../types/chart.js";
import type { SchemaInfo } from "../analysis/schemaInspector.js";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { responseFormatterSchemaRaw } from "../config/JsonSchemas.js";

export interface GenerateChartSpecOptions {
  prompt: string;
  sampleData: { columns: string[]; rows: string[][] };
  config: ResolvedConfig;
  chatHistory?: BaseMessage[];
  schema?: SchemaInfo;
}

/**
 * Call the LLM with structured output to generate chartSpec metadata.
 * Uses plain ChatOpenAI — no LangGraph, no DB, no sessions.
 */
export async function generateChartSpec(
  options: GenerateChartSpecOptions,
): Promise<ChartResult> {
  const { prompt, sampleData, config, chatHistory, schema } = options;

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
      responseFormatterPrompt(prompt, sampleData, schema),
    );
    const humanMessage = new HumanMessage(prompt);

    const messages: BaseMessage[] = chatHistory?.length
      ? [systemMessage, ...chatHistory, humanMessage]
      : [systemMessage, humanMessage];

    // Avoid excessive type instantiation from mixed Zod/JSON schema inference.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const outputSchema: any =
      config.provider === "openai"
        ? responseFormatterSchema
        : responseFormatterSchemaRaw;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const structuredModel = (model as any).withStructuredOutput(outputSchema);
    const response = await structuredModel.invoke(messages);

    return response as ChartResult;
  } catch (err) {
    if (err instanceof LLMError) throw err;
    throw new LLMError(
      `Failed to generate chartSpec: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
