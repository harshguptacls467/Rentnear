import { SUPPORTED_CHART_TYPES } from "@openvizai/shared-types";
import type { ChartType } from "@openvizai/shared-types";
import type { SchemaInfo } from "../analysis/schemaInspector.js";

function formatSchemaHints(schema?: SchemaInfo): string {
  if (!schema || schema.columns.length === 0) return "";

  const lines = schema.columns.map((col) => `  - "${col.name}" (${col.type})`);
  return `
Column schema (inferred types):
${lines.join("\n")}
`;
}

function formatChartConstraint(charts?: ChartType[]): string {
  if (!charts || charts.length === 0) return "";
  return `
IMPORTANT: You MUST only use these chart types: ${charts.map((t) => `"${t}"`).join(", ")}.
Do not use any chart type outside this list.
`;
}

function formatMaxChartsConstraint(maxCharts?: number): string {
  if (!maxCharts) return "";
  return `
IMPORTANT: Return at most ${maxCharts} charts. Choose the ${maxCharts} most insightful combinations.
`;
}

export const dashboardPlannerPrompt = (
  userPrompt: string,
  dataSample: unknown,
  schema?: SchemaInfo,
  charts?: ChartType[],
  maxCharts?: number,
): string => `
You are a data visualization dashboard planner that returns multiple chart configurations in a single JSON response.

Primary goal:
- Analyze the data and produce an array of DISTINCT, MEANINGFUL chart configurations.
- Each chart should reveal a different insight — avoid redundant views of the same relationship.
- Return ONLY valid JSON that matches the backend schema (an array of chart objects).

Data Sample (columns + preview rows):
${JSON.stringify(dataSample)}
${formatSchemaHints(schema)}
UserPrompt:
${userPrompt}
${formatChartConstraint(charts)}${formatMaxChartsConstraint(maxCharts)}
Available chart types: ${SUPPORTED_CHART_TYPES.map((t) => `"${t}"`).join(", ")}.

Chart selection intelligence — pick charts based on data characteristics:
- time/date field + numeric fields → line chart (trends over time)
- categorical + numeric → bar chart (category comparison)
- categorical + single numeric (2-6 categories) → pie/donut (distribution)
- multiple numeric metrics across categories → radar (profile comparison)
- explicit start/end numeric or date ranges → range_bar
- multiple numeric fields over time → consider both line (for trend) and stacked bar (for composition)
- If the user explicitly requests certain chart types, prioritize those.

Diversity rules:
- Each chart in the array MUST use a different chart_type OR a meaningfully different field combination.
- Do NOT produce two charts with the same chart_type AND the same fields.
- Prefer covering different aspects of the data (e.g., trend + distribution + comparison).

chartSpec rules per chart_type (same as single-chart mode):
- line/bar: x (one field array), y (one+ fields array), category/value/start/end = null.
- radar: x (one field array), y (one+ fields array), start/end/category/value = null.
- range_bar: x (one field), start (one field), end (one field), y = null, is_horizontal = true.
- pie/donut: category (one field), value (one field), x/y = null.

Field rules:
- Use ONLY fields that exist in the data sample. Never invent fields.
- Never use identifier fields (id, _id, uuid, key, pk) as y-axis or value fields.

Each chart object must have:
- meta: { title, subtitle (nullable), query_explanation }
- chart_type: one of the supported types
- chartSpec: full chartSpec object with all fields (null those not used)

Make each title descriptive of the specific insight that chart reveals.

CRITICAL: You MUST return AT LEAST 2 charts and ideally 3-4. A single chart is NOT acceptable as a dashboard. Each chart must be a complete object with all chartSpec fields present (set unused ones to null).
`;
