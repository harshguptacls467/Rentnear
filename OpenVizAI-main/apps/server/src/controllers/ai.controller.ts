import { Request, Response, NextFunction } from "express";
import { HTTP_STATUS_CODE, successResponse } from "@utils/index";
import { createSampleLangGraph } from "@services/AI/graph/sampleLangGraph";
import SessionService from "../services/session.service";
import ChatHistoryService from "@services/chatHistory.service";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import pgPool from "@config/pgPool";
import logger from "@logger/index";
import { IAuthUser } from "@interfaces/user";
import { analyzeDashboard } from "@openvizai/core";
import { GEMINI_API_KEY, OPENAI_API_KEY } from "@config/secrets";

// extend request to include authenticated user
interface AuthRequest extends Request {
  user?: IAuthUser;
}

class AIController {
  public async generateAnswer(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { prompt, data, sessionId, dashboardMode, maxCharts, charts } =
        req.body;
      const userId = req.user.id;

      // Validate request body
      if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          statusCode: HTTP_STATUS_CODE.BAD_REQUEST,
          message: "prompt must be a non-empty string",
        });
      }
      if (!Array.isArray(data) || data.length === 0) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          statusCode: HTTP_STATUS_CODE.BAD_REQUEST,
          message: "data must be a non-empty array of objects",
        });
      }
      if (!sessionId || typeof sessionId !== "string") {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          statusCode: HTTP_STATUS_CODE.BAD_REQUEST,
          message: "sessionId must be a non-empty string",
        });
      }
      // Dashboard mode: generate multiple charts via analyzeDashboard
      if (dashboardMode) {
        const llmProvider = OPENAI_API_KEY ? "openai" : "google";
        const llmApiKey = OPENAI_API_KEY || GEMINI_API_KEY;
        const model =
          llmProvider === "openai"
            ? "gpt-5-mini-2025-08-07"
            : "gemini-3-flash-preview";

        const { result } = await analyzeDashboard({
          prompt,
          data,
          config: { apiKey: llmApiKey, provider: llmProvider, model: model },
          charts,
          maxCharts,
        });

        return successResponse(
          res,
          HTTP_STATUS_CODE.OK,
          "dashboard generated",
          {
            result,
            rows: data,
          },
        );
      }

      // Default: single chart via LangGraph
      const postgresSaver = new PostgresSaver(pgPool);

      const graph = await createSampleLangGraph(
        postgresSaver,
        sessionId,
        userId,
        prompt,
        data,
      );
      const result = await graph.invoke(
        {
          userPrompt: prompt,
          data: data,
        },
        {
          configurable: { thread_id: sessionId },
        },
      );

      return successResponse(
        res,
        HTTP_STATUS_CODE.OK,
        "chart specification generated",
        {
          result: result.result,
          rows: data,
        },
      );
    } catch (error) {
      next(error);
    }
  }

  public async getSessionMessages(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { sessionId } = req.params;
      const session = await SessionService.getSessionById(sessionId);
      const chatHistory =
        await ChatHistoryService.getChatHistoryBySessionId(sessionId);
      return successResponse(res, HTTP_STATUS_CODE.OK, "Success", {
        session: session,
        messages: chatHistory,
      });
    } catch (error) {
      logger.error("Error in getChatHistory", error);
      next(error);
    }
  }
}

export default new AIController();
