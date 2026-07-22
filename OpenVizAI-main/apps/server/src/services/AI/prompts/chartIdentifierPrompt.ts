import { SUPPORTED_CHART_TYPES } from "@openvizai/shared-types";

export const chartIdentifierPrompt = (userPrompt: string, dataSample: any) => `
You are a senior data visualization expert and chart selector.
Your job is to pick the single most appropriate chart_type for the given user prompt and data sample.

Data Sample (columns + preview rows already preprocessed for you):
${JSON.stringify(dataSample)}

UserPrompt:
${userPrompt}

<@AVAILABLE CHART TYPES@>
- "line": time-series or ordered numeric trends (e.g., metric over time or index).
- "radar": compare multiple numeric metrics across a shared set of categories.
- "bar": comparisons across categories using bars/columns (grouped or stacked).
- "range_bar": start/end ranges when the data has explicit start and end fields (e.g., durations, timelines).
- "pie": part-to-whole comparison with a small number of categories (2–5 slices) forming a single whole.
- "donut": same as pie but with an empty center, used when percentages and totals are emphasized.

<@SELECTION RULES@>
- Prefer "line" when:
  - There is a time, date, or ordered numeric field suitable for the x-axis.
  - The user cares about trends, change over time, or sequences.
- Prefer "bar" when:
  - Comparing values across categories (departments, regions, products, statuses, etc.).
  - Comparing distributions when bins already exist (e.g., "0–9", "10–19").
- Prefer "radar" when:
  - The x-axis is a compact set of categories and each category has multiple comparable numeric metrics.
  - The goal is shape/profile comparison across categories rather than strict trend over time.
- Prefer "range_bar" when:
  - There are explicit start and end fields that describe ranges (e.g., project start/end, min/max).
  - A timeline or duration comparison across entities is needed.
- Prefer "pie" or "donut" when:
  - A single categorical field partitions a whole into a few parts (2–5 categories).
  - The user explicitly asks for a pie/donut AND it is not misleading (few categories, clear total).
  - Use "donut" instead of "pie" when the user mentions donut/ring or when you want to emphasize percentages.
- If the user explicitly asks for a chart type, respect it when it is reasonable with the given data.
- If multiple chart types could work, choose the one that best matches readability and the rules above.

<@OUTPUT FORMAT@>
Return STRICTLY valid JSON with this shape:
{
  "chart_type": ${SUPPORTED_CHART_TYPES.map((t) => `"${t}"`).join(" | ")},
  "reason": "short natural language justification"
}

Do NOT include any additional fields. Do NOT wrap the JSON in markdown.
`;
