import { analyzeChart } from "@openvizai/core";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { GEMINI_API_KEY, OPENAI_API_KEY } from "@config/secrets";
import pgPool from "@config/pgPool";
import ChatHistoryService from "@services/chatHistory.service";
import customErrorHandler from "@utils/customErrorHandler";
import SessionService from "@services/session.service";

export const responseFormatterNode = async (state: any) => {
  try {
    const userPrompt = state.userPrompt as string;
    const data = state.data;
    const sessionId = state.sessionId as string;
    const userId = state.userId as string;

    await SessionService.ensureSessionExists(sessionId, userId, userPrompt);

    const userMessage = new HumanMessage({
      content: userPrompt,
      additional_kwargs: {
        data,
      },
    });

    await ChatHistoryService.addChatHistory(sessionId, userMessage, pgPool);
    const previousChatHistory = await ChatHistoryService.getPreviousMessages(
      sessionId,
      pgPool,
    );

    // Delegate to @openvizai/core using whichever API key is available
    const llmProvider = OPENAI_API_KEY ? "openai" : "google";
    const llmApiKey = OPENAI_API_KEY || GEMINI_API_KEY;
    const model =
      llmProvider === "openai"
        ? "gpt-5-mini-2025-08-07"
        : "gemini-3-flash-preview";

    const { result } = await analyzeChart({
      prompt: userPrompt,
      data: Array.isArray(data) ? data : [],
      config: {
        apiKey: llmApiKey,
        provider: llmProvider,
        model: model,
      },
    });

    const aiMessage = new AIMessage({
      response_metadata: result as unknown as Record<string, unknown>,
    });

    await ChatHistoryService.addChatHistory(sessionId, aiMessage, pgPool);

    const messages = [...previousChatHistory, userMessage];

    return {
      ...state,
      messages,
      result,
      responseFormatterAgent: [userMessage, aiMessage],
    };
  } catch (err) {
    console.error("Error in responseFormatterNode:", err);
    throw new customErrorHandler(400, `${err}`);
  }
};
