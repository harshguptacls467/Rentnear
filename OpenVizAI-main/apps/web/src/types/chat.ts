import type {
  ChartConfig,
  ChartMeta,
  ChartSpec,
  DashboardChartItem,
  DashboardResult,
  SingleChartResult,
} from "@openvizai/shared-types";

export type Session = {
  session_id: string;
  user_id: string;
  title: string;
  created_ts: string;
  updated_ts: string;
};

export type { ChartMeta, ChartSpec, DashboardChartItem };

export type ChartResultItem = {
  chart_type: ChartConfig["chart_type"];
  chartSpec: ChartSpec;
};

export type SingleChartResultView = Omit<SingleChartResult, "chart"> & {
  chart: ChartResultItem;
};

export type DashboardResultView = Omit<DashboardResult, "charts"> & {
  charts: ChartResultItem[];
};

export type ChartResultData = SingleChartResultView | DashboardResultView;

export type Message = {
  type: "human" | "ai";
  content: string;
  additional_kwargs: {
    data?: unknown;
  };
  response_metadata: SingleChartResultView;
};

export type MessageResponse = {
  id: string;
  message: Message;
};

export type SessionMessageResponse = {
  session: Session;
  messages: MessageResponse[];
};
