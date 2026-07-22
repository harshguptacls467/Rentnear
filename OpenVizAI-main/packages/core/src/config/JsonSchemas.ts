import { SUPPORTED_CHART_TYPES } from "@openvizai/shared-types";

// Raw JSON schema — Gemini compatible
const chartSpecField = {
  type: "object",
  properties: {
    field: { type: "string" },
    label: { type: "string" },
    unit: { type: "string" },
  },
  required: ["field", "label"],
};

const chartSpecFieldWithType = {
  type: "object",
  properties: {
    field: { type: "string" },
    label: { type: "string" },
    unit: { type: "string" },
    type: { type: "string", enum: ["bar", "line", "area"] },
  },
  required: ["field", "label", "type"],
};

export const responseFormatterSchemaRaw = {
  type: "object",
  properties: {
    response_type: { type: "string", enum: ["graphical"] },
    meta: {
      type: "object",
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        query_explanation: { type: "string" },
      },
      required: ["title", "query_explanation"],
    },
    chart: {
      type: "object",
      properties: {
        chart_type: { type: "string", enum: SUPPORTED_CHART_TYPES },
        chartSpec: {
          type: "object",
          properties: {
            x: { type: "array", items: chartSpecField },
            y: { type: "array", items: chartSpecFieldWithType },
            group: { type: "array", items: chartSpecField },
            category: { type: "array", items: chartSpecField },
            value: { type: "array", items: chartSpecField },
            source: { type: "array", items: chartSpecField },
            target: { type: "array", items: chartSpecField },
            start: { type: "array", items: chartSpecField },
            end: { type: "array", items: chartSpecField },
            series: { type: "array", items: chartSpecField },
            path: { type: "array", items: chartSpecField },
            is_stacked: { type: "boolean" },
            is_horizontal: { type: "boolean" },
            isSemanticColors: { type: "boolean" },
            colorSemantic: {
              type: "string",
              enum: [
                "positive",
                "negative",
                "neutral",
                "warning",
                "caution",
                "target",
                "highlight",
                "missing",
                "forecast",
              ],
            },
          },
          required: ["is_stacked", "is_horizontal", "isSemanticColors"],
        },
      },
      required: ["chart_type", "chartSpec"],
    },
  },
  required: ["response_type", "meta", "chart"],
};

export const dashboardResponseSchemaRaw = {
  type: "object",
  properties: {
    charts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          chart_type: { type: "string", enum: SUPPORTED_CHART_TYPES },
          meta: {
            type: "object",
            properties: {
              title: { type: "string" },
              subtitle: { type: "string" },
              query_explanation: { type: "string" },
            },
            required: ["title", "query_explanation"],
          },
          chartSpec: {
            type: "object",
            properties: {
              x: { type: "array", items: chartSpecField },
              y: { type: "array", items: chartSpecFieldWithType },
              group: { type: "array", items: chartSpecField },
              category: { type: "array", items: chartSpecField },
              value: { type: "array", items: chartSpecField },
              source: { type: "array", items: chartSpecField },
              target: { type: "array", items: chartSpecField },
              start: { type: "array", items: chartSpecField },
              end: { type: "array", items: chartSpecField },
              series: { type: "array", items: chartSpecField },
              path: { type: "array", items: chartSpecField },
              is_stacked: { type: "boolean" },
              is_horizontal: { type: "boolean" },
              isSemanticColors: { type: "boolean" },
              colorSemantic: {
                type: "string",
                enum: [
                  "positive",
                  "negative",
                  "neutral",
                  "warning",
                  "caution",
                  "target",
                  "highlight",
                  "missing",
                  "forecast",
                ],
              },
            },
            required: ["is_stacked", "is_horizontal", "isSemanticColors"],
          },
        },
        required: ["chart_type", "meta", "chartSpec"],
      },
    },
  },
  required: ["charts"],
};
