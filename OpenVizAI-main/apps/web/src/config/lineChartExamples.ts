import type { ChartType } from "@openvizai/shared-types";

export type EmbeddingAxisField = {
  field: string;
  label: string;
  unit: string | null;
  // Optional subtype for future use (line, area, etc.)
  type?: string | null;
};

export type LineChartEmbedding = {
  x: EmbeddingAxisField[];
  y: EmbeddingAxisField[];
  group: string | null;
  category: string | null;
  value: string | null;
  source: string | null;
  target: string | null;
  start: string | null;
  end: string | null;
  series: string | null;
  path: string | null;
  is_stacked: boolean;
  is_horizontal: boolean;
  isSemanticColors: boolean;
  colorSemantic: string | null;
  // Optional line-specific display hints for ApexCharts
  line_curve?: "smooth" | "straight" | "stepline";
  markers_size?: number;
  // When true/unit === 'datetime', frontend will treat x as time-series
  // and use ApexCharts datetime xaxis with { x, y } points.
  forecast_points?: number;
};

export type GraphicalMeta = {
  title: string;
  subtitle: string | null;
  query_explanation: string | null;
};

export type GraphicalChart = {
  chart_type: Extract<ChartType, "line" | "radar">;
  embedding: LineChartEmbedding;
};

export type GraphicalResult = {
  response_type: "graphical";
  meta: GraphicalMeta;
  chart: GraphicalChart;
};

export type LineChartVariant = {
  id: string;
  label: string;
  result: GraphicalResult;
  // Generic tabular rows which will be mapped using the embedding
  rows: Record<string, string | number>[];
};

// Variant 1: Monthly Revenue / Expenses / Profit (mirrors apps/server/test.json structure)
export const monthlyFinanceVariant: LineChartVariant = {
  id: "monthly-finance",
  label: "Monthly Revenue vs Expenses vs Profit",
  result: {
    response_type: "graphical",
    meta: {
      title: "Monthly Revenue and Expenses Comparison",
      subtitle: "abcd...",
      query_explanation:
        "A line chart showing revenue, expenses, and profit over months to illustrate financial trends.",
    },
    chart: {
      chart_type: "line",
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
            field: "revenue",
            label: "Revenue",
            unit: "USD",
            type: "line",
          },
          {
            field: "expenses",
            label: "Expenses",
            unit: "USD",
            type: "line",
          },
          {
            field: "profit",
            label: "Profit",
            unit: "USD",
            type: "line",
          },
        ],
        group: null,
        category: null,
        value: null,
        source: null,
        target: null,
        start: null,
        end: null,
        series: null,
        path: null,
        is_stacked: false,
        is_horizontal: false,
        isSemanticColors: false,
        colorSemantic: null,
        line_curve: "smooth",
        markers_size: 0,
      },
    },
  },
  rows: [
    { month: "Jan", revenue: 12000, expenses: 8000, profit: 4000 },
    { month: "Feb", revenue: 13500, expenses: 8200, profit: 5300 },
    { month: "Mar", revenue: 15000, expenses: 9000, profit: 6000 },
    { month: "Apr", revenue: 16000, expenses: 9500, profit: 6500 },
    { month: "May", revenue: 19000, expenses: 10000, profit: 9000 },
    { month: "Jun", revenue: 21000, expenses: 12000, profit: 9000 },
  ],
};

// Variant 2: Daily Active Users for multiple platforms
export const dailyActiveUsersVariant: LineChartVariant = {
  id: "daily-active-users",
  label: "Daily Active Users by Platform",
  result: {
    response_type: "graphical",
    meta: {
      title: "Daily Active Users",
      subtitle: "Web vs iOS vs Android (Last 7 days)",
      query_explanation:
        "Compares daily active users across platforms to understand engagement trends.",
    },
    chart: {
      chart_type: "line",
      embedding: {
        x: [
          {
            field: "day",
            label: "Day",
            unit: null,
          },
        ],
        y: [
          {
            field: "web_dau",
            label: "Web",
            unit: "users",
            type: "line",
          },
          {
            field: "ios_dau",
            label: "iOS",
            unit: "users",
            type: "line",
          },
          {
            field: "android_dau",
            label: "Android",
            unit: "users",
            type: "line",
          },
        ],
        group: null,
        category: null,
        value: null,
        source: null,
        target: null,
        start: null,
        end: null,
        series: null,
        path: null,
        is_stacked: false,
        is_horizontal: false,
        isSemanticColors: false,
        colorSemantic: null,
        line_curve: "straight",
        markers_size: 0,
      },
    },
  },
  rows: [
    { day: "Mon", web_dau: 1200, ios_dau: 800, android_dau: 1000 },
    { day: "Tue", web_dau: 1400, ios_dau: 900, android_dau: 1100 },
    { day: "Wed", web_dau: 1600, ios_dau: 1000, android_dau: 1300 },
    { day: "Thu", web_dau: 1550, ios_dau: 1100, android_dau: 1250 },
    { day: "Fri", web_dau: 1800, ios_dau: 1200, android_dau: 1500 },
    { day: "Sat", web_dau: 1900, ios_dau: 1300, android_dau: 1600 },
    { day: "Sun", web_dau: 1700, ios_dau: 1250, android_dau: 1450 },
  ],
};

// Variant 3: Stacked line-like series (cumulative metrics)
export const cumulativeTrafficVariant: LineChartVariant = {
  id: "cumulative-traffic",
  label: "Cumulative Traffic by Channel",
  result: {
    response_type: "graphical",
    meta: {
      title: "Cumulative Traffic",
      subtitle: "Stacked style example",
      query_explanation:
        "Shows cumulative traffic over weeks split by marketing channel.",
    },
    chart: {
      chart_type: "line",
      embedding: {
        x: [
          {
            field: "week",
            label: "Week",
            unit: null,
          },
        ],
        y: [
          {
            field: "organic",
            label: "Organic",
            unit: "visits",
            type: "line",
          },
          {
            field: "paid",
            label: "Paid",
            unit: "visits",
            type: "line",
          },
          {
            field: "referral",
            label: "Referral",
            unit: "visits",
            type: "line",
          },
        ],
        group: null,
        category: null,
        value: null,
        source: null,
        target: null,
        start: null,
        end: null,
        series: null,
        path: null,
        is_stacked: true,
        is_horizontal: false,
        isSemanticColors: false,
        colorSemantic: null,
        line_curve: "stepline",
        markers_size: 0,
      },
    },
  },
  rows: [
    { week: "W1", organic: 300, paid: 200, referral: 100 },
    { week: "W2", organic: 600, paid: 350, referral: 180 },
    { week: "W3", organic: 900, paid: 500, referral: 260 },
    { week: "W4", organic: 1300, paid: 700, referral: 340 },
  ],
};

export const lineChartVariants: LineChartVariant[] = [
  monthlyFinanceVariant,
  dailyActiveUsersVariant,
  cumulativeTrafficVariant,
];

// Variant 4: Line chart with prominent markers
export const markersLineVariant: LineChartVariant = {
  id: "markers-line",
  label: "Line with markers",
  result: {
    response_type: "graphical",
    meta: {
      title: "Conversion Rate with Markers",
      subtitle: "Weekly conversion trend",
      query_explanation:
        "Shows conversion rate over weeks with visible markers on each data point.",
    },
    chart: {
      chart_type: "line",
      embedding: {
        x: [
          {
            field: "week",
            label: "Week",
            unit: null,
          },
        ],
        y: [
          {
            field: "conversion_rate",
            label: "Conversion Rate",
            unit: "%",
            type: "line",
          },
        ],
        group: null,
        category: null,
        value: null,
        source: null,
        target: null,
        start: null,
        end: null,
        series: null,
        path: null,
        is_stacked: false,
        is_horizontal: false,
        isSemanticColors: false,
        colorSemantic: null,
        line_curve: "smooth",
        markers_size: 6,
      },
    },
  },
  rows: [
    { week: "W1", conversion_rate: 1.2 },
    { week: "W2", conversion_rate: 1.4 },
    { week: "W3", conversion_rate: 1.1 },
    { week: "W4", conversion_rate: 1.7 },
    { week: "W5", conversion_rate: 1.9 },
  ],
};

// Variant 5: Combo chart (line + column)
export const comboLineColumnVariant: LineChartVariant = {
  id: "combo-line-column",
  label: "Combo: Line + Column",
  result: {
    response_type: "graphical",
    meta: {
      title: "Revenue vs Orders",
      subtitle: "Monthly (line + column)",
      query_explanation:
        "Combo chart comparing revenue (column) vs number of orders (line).",
    },
    chart: {
      chart_type: "line",
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
            field: "revenue",
            label: "Revenue",
            unit: "USD",
            type: "column",
          },
          {
            field: "orders",
            label: "Orders",
            unit: "count",
            type: "line",
          },
        ],
        group: null,
        category: null,
        value: null,
        source: null,
        target: null,
        start: null,
        end: null,
        series: null,
        path: null,
        is_stacked: false,
        is_horizontal: false,
        isSemanticColors: false,
        colorSemantic: null,
        line_curve: "smooth",
        markers_size: 0,
      },
    },
  },
  rows: [
    { month: "Jan", revenue: 12000, orders: 320 },
    { month: "Feb", revenue: 15000, orders: 350 },
    { month: "Mar", revenue: 17000, orders: 410 },
    { month: "Apr", revenue: 16000, orders: 390 },
    { month: "May", revenue: 19000, orders: 450 },
  ],
};

// Variant 6: Multi-axis line chart (different units)
export const multiAxisVariant: LineChartVariant = {
  id: "multi-axis-line",
  label: "Multi-axis Line",
  result: {
    response_type: "graphical",
    meta: {
      title: "Temperature vs Rainfall",
      subtitle: "Daily for one week",
      query_explanation:
        "Multi-axis chart showing temperature (°C) and rainfall (mm) with separate y-axes.",
    },
    chart: {
      chart_type: "line",
      embedding: {
        x: [
          {
            field: "day",
            label: "Day",
            unit: null,
          },
        ],
        y: [
          {
            field: "temperature",
            label: "Temperature",
            unit: "°C",
            type: "line",
          },
          {
            field: "rainfall",
            label: "Rainfall",
            unit: "mm",
            type: "column",
          },
        ],
        group: null,
        category: null,
        value: null,
        source: null,
        target: null,
        start: null,
        end: null,
        series: null,
        path: null,
        is_stacked: false,
        is_horizontal: false,
        isSemanticColors: false,
        colorSemantic: null,
        line_curve: "smooth",
        markers_size: 4,
      },
    },
  },
  rows: [
    { day: "Mon", temperature: 18, rainfall: 5 },
    { day: "Tue", temperature: 20, rainfall: 8 },
    { day: "Wed", temperature: 22, rainfall: 2 },
    { day: "Thu", temperature: 21, rainfall: 10 },
    { day: "Fri", temperature: 19, rainfall: 6 },
    { day: "Sat", temperature: 23, rainfall: 1 },
    { day: "Sun", temperature: 24, rainfall: 0 },
  ],
};

// Variant 7: Time-series line with forecast points
export const timeSeriesForecastVariant: LineChartVariant = {
  id: "time-series-forecast",
  label: "Time-series with Forecast",
  result: {
    response_type: "graphical",
    meta: {
      title: "Daily Signups (with Forecast)",
      subtitle: "Last 10 days + next 3 (forecast)",
      query_explanation:
        "Time-series line chart of daily signups with forecasted future points.",
    },
    chart: {
      chart_type: "line",
      embedding: {
        x: [
          {
            field: "date",
            label: "Date",
            unit: "datetime",
          },
        ],
        y: [
          {
            field: "signups",
            label: "Signups",
            unit: "count",
            type: "line",
          },
        ],
        group: null,
        category: null,
        value: null,
        source: null,
        target: null,
        start: null,
        end: null,
        series: null,
        path: null,
        is_stacked: false,
        is_horizontal: false,
        isSemanticColors: false,
        colorSemantic: null,
        line_curve: "smooth",
        markers_size: 0,
        forecast_points: 3,
      },
    },
  },
  rows: [
    { date: "2025-01-01", signups: 120 },
    { date: "2025-01-02", signups: 140 },
    { date: "2025-01-03", signups: 135 },
    { date: "2025-01-04", signups: 150 },
    { date: "2025-01-05", signups: 160 },
    { date: "2025-01-06", signups: 170 },
    { date: "2025-01-07", signups: 190 },
    { date: "2025-01-08", signups: 200 },
    { date: "2025-01-09", signups: 210 },
    { date: "2025-01-10", signups: 220 },
  ],
};

// Extend the exported list with all variants
export const allLineChartVariants: LineChartVariant[] = [
  monthlyFinanceVariant,
  dailyActiveUsersVariant,
  cumulativeTrafficVariant,
  markersLineVariant,
  comboLineColumnVariant,
  multiAxisVariant,
  timeSeriesForecastVariant,
];
