import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { responseFormatterNode } from "../agents/responseFormatter";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { BaseMessage } from "@langchain/core/messages";
import type { ChartType } from "@openvizai/shared-types";

export const createSampleLangGraph = async (
  checkPointer: PostgresSaver,
  sessionId: string,
  userId: string,
  userPrompt: string,
  data: any,
) => {
  const StateAnnotation = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
      reducer: (_, y) => y,
    }),
    sessionId: Annotation<string>({
      value: (x, y) => y,
      default: () => sessionId,
    }),
    userId: Annotation<string>({
      value: (x, y) => y,
      default: () => userId,
    }),
    data: Annotation<any>({
      value: (x, y) => y,
      default: () => data,
    }),
    userPrompt: Annotation<string>({
      value: (x, y) => y,
      default: () => userPrompt,
    }),
    chartType: Annotation<ChartType>(),
    chartReason: Annotation<string>(),
    result: Annotation<string>(),
    responseFormatterAgent: Annotation<BaseMessage[]>({
      reducer: (x, y) => x.concat(y),
    }),
  });

  const workflow = new StateGraph(StateAnnotation)
    .addNode("responseFormatter", responseFormatterNode)
    .addEdge(START, "responseFormatter")
    .addEdge("responseFormatter", END);

  const graph = workflow.compile({
    checkpointer: checkPointer,
  });
  await checkPointer.setup();

  return graph;
};
