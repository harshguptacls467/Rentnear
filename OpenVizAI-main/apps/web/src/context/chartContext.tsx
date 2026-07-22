import { createContext, useContext, useState, type ReactNode } from "react";
import type { ChartResultData } from "../types/chat";
import type { ChartType } from "@openvizai/shared-types";

type ChartState = {
  rows: Record<string, unknown>[];
  setRows: (rows: Record<string, unknown>[]) => void;

  prompt: string;
  setPrompt: (p: string) => void;

  dataInput: string;
  setDataInput: (d: string) => void;

  chartResult: ChartResultData | null;
  setChartResult: (r: ChartResultData | null) => void;

  dashboardMode: boolean;
  setDashboardMode: (v: boolean) => void;

  maxCharts: number;
  setMaxCharts: (n: number) => void;

  preferredCharts: ChartType[];
  setPreferredCharts: (c: ChartType[]) => void;
};

const ChartContext = createContext<ChartState | null>(null);

export function ChartProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [prompt, setPrompt] = useState("");
  const [dataInput, setDataInput] = useState("");
  const [chartResult, setChartResult] = useState<ChartResultData | null>(null);
  const [dashboardMode, setDashboardMode] = useState(false);
  const [maxCharts, setMaxCharts] = useState(3);
  const [preferredCharts, setPreferredCharts] = useState<ChartType[]>([]);

  return (
    <ChartContext.Provider
      value={{
        rows,
        setRows,
        prompt,
        setPrompt,
        dataInput,
        setDataInput,
        chartResult,
        setChartResult,
        dashboardMode,
        setDashboardMode,
        maxCharts,
        setMaxCharts,
        preferredCharts,
        setPreferredCharts,
      }}
    >
      {children}
    </ChartContext.Provider>
  );
}

export function useChartState() {
  const ctx = useContext(ChartContext);

  if (!ctx) {
    throw new Error("useChartState must be used inside ChartProvider");
  }

  return ctx;
}
