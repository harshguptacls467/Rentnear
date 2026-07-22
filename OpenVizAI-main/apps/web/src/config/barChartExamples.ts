import type { EmbeddingAxisField, GraphicalMeta } from "./lineChartExamples";
import type { ChartType } from "@openvizai/shared-types";

export type BarChartEmbedding = {
  x: EmbeddingAxisField[];
  y: EmbeddingAxisField[];
  // Optional range fields for range bar charts
  start?: EmbeddingAxisField;
  end?: EmbeddingAxisField;
  is_horizontal: boolean;
  is_stacked: boolean;
  // When true, frontend will render Apex type 'rangeBar'
  is_range: boolean;
};

export type BarGraphicalChart = {
  // 'bar' covers both bar and column; 'range_bar' maps to Apex 'rangeBar'
  chart_type: Extract<ChartType, "bar" | "range_bar">;
  embedding: BarChartEmbedding;
};

export type BarGraphicalResult = {
  response_type: "graphical";
  meta: GraphicalMeta;
  chart: BarGraphicalChart;
};

export type BarChartVariant = {
  id: string;
  label: string;
  result: BarGraphicalResult;
  rows: Record<string, string | number>[];
};

// Variant 1: Simple vertical column chart (per Column Chart docs)
export const monthlySalesColumnVariant: BarChartVariant = {
  id: "monthly-sales-column",
  label: "Monthly Sales (Column)",
  result: {
    response_type: "graphical",
    meta: {
      title: "Monthly Sales",
      subtitle: "Column chart",
      query_explanation:
        "Column chart showing monthly sales values for the current year.",
    },
    chart: {
      chart_type: "bar",
      embedding: {
        x: [
          {
            field: "month",
            label: "Month",
            unit: null,
          },
        ],
        y: [
          {
            field: "sales",
            label: "Sales",
            unit: "USD",
            type: "bar",
          },
        ],
        is_horizontal: false,
        is_stacked: false,
        is_range: false,
      },
    },
  },
  rows: [
    { month: "Jan", sales: 12000 },
    { month: "Feb", sales: 15000 },
    { month: "Mar", sales: 14000 },
    { month: "Apr", sales: 18000 },
    { month: "May", sales: 21000 },
    { month: "Jun", sales: 19000 },
  ],
};

// Variant 2: Horizontal bar chart (per Bar Chart docs)
export const departmentSpendBarVariant: BarChartVariant = {
  id: "department-spend-bar",
  label: "Department Spend (Horizontal Bar)",
  result: {
    response_type: "graphical",
    meta: {
      title: "Department Spend",
      subtitle: "Horizontal bar",
      query_explanation:
        "Horizontal bar chart comparing spend across departments.",
    },
    chart: {
      chart_type: "bar",
      embedding: {
        x: [
          {
            field: "department",
            label: "Department",
            unit: null,
          },
        ],
        y: [
          {
            field: "spend",
            label: "Spend",
            unit: "USD",
            type: "bar",
          },
        ],
        is_horizontal: true,
        is_stacked: false,
        is_range: false,
      },
    },
  },
  rows: [
    { department: "Engineering", spend: 520000 },
    { department: "Marketing", spend: 310000 },
    { department: "Sales", spend: 430000 },
    { department: "HR", spend: 120000 },
  ],
};

// Variant 3: Stacked column chart
export const stackedRevenueChannelVariant: BarChartVariant = {
  id: "stacked-revenue-channel",
  label: "Revenue by Channel (Stacked Column)",
  result: {
    response_type: "graphical",
    meta: {
      title: "Revenue by Channel",
      subtitle: "Stacked column chart",
      query_explanation:
        "Stacked column chart showing revenue split by channel per quarter.",
    },
    chart: {
      chart_type: "bar",
      embedding: {
        x: [
          {
            field: "quarter",
            label: "Quarter",
            unit: null,
          },
        ],
        y: [
          {
            field: "online",
            label: "Online",
            unit: "USD",
            type: "bar",
          },
          {
            field: "retail",
            label: "Retail",
            unit: "USD",
            type: "bar",
          },
          {
            field: "partners",
            label: "Partners",
            unit: "USD",
            type: "bar",
          },
        ],
        is_horizontal: false,
        is_stacked: true,
        is_range: false,
      },
    },
  },
  rows: [
    { quarter: "Q1", online: 40000, retail: 25000, partners: 15000 },
    { quarter: "Q2", online: 48000, retail: 27000, partners: 18000 },
    { quarter: "Q3", online: 52000, retail: 30000, partners: 21000 },
    { quarter: "Q4", online: 60000, retail: 35000, partners: 24000 },
  ],
};

// Variant 4: Range bar chart (per Range Bar docs)
export const projectTimelineRangeBarVariant: BarChartVariant = {
  id: "project-timeline-range-bar",
  label: "Project Timelines (Range Bar)",
  result: {
    response_type: "graphical",
    meta: {
      title: "Project Timelines",
      subtitle: "Range bar",
      query_explanation:
        "Range bar chart showing project start and end dates on a timeline.",
    },
    chart: {
      chart_type: "range_bar",
      embedding: {
        x: [
          {
            field: "project",
            label: "Project",
            unit: null,
          },
        ],
        y: [],
        start: {
          field: "start",
          label: "Start",
          unit: "datetime",
        },
        end: {
          field: "end",
          label: "End",
          unit: "datetime",
        },
        is_horizontal: true,
        is_stacked: false,
        is_range: true,
      },
    },
  },
  rows: [
    { project: "Alpha", start: "2025-01-01", end: "2025-03-15" },
    { project: "Beta", start: "2025-02-10", end: "2025-05-01" },
    { project: "Gamma", start: "2025-03-05", end: "2025-06-20" },
  ],
};

export const allBarChartVariants: BarChartVariant[] = [
  monthlySalesColumnVariant,
  departmentSpendBarVariant,
  stackedRevenueChannelVariant,
  projectTimelineRangeBarVariant,
];
