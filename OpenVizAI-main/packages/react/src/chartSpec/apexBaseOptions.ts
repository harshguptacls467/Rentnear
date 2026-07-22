type LegendPosition = "top" | "bottom" | "left" | "right";

type BuildBaseOptionsParams = {
  chartId: string;
  title?: string;
  subtitle?: string | null;
  legendPosition?: LegendPosition;
  dataLabelsEnabled?: boolean;
  toolbarVisible?: boolean;
};

// Creates option blocks reused across chart types; components can extend/override chart-specific fields.
export function buildApexBaseOptions({
  chartId,
  title,
  subtitle,
  legendPosition = "top",
  dataLabelsEnabled = false,
  toolbarVisible = true,
}: BuildBaseOptionsParams) {
  return {
    chart: {
      id: chartId,
      toolbar: {
        show: toolbarVisible,
      },
    },
    title: {
      text: title,
      align: "left" as const,
    },
    subtitle: {
      text: subtitle ?? undefined,
      align: "left" as const,
    },
    dataLabels: {
      enabled: dataLabelsEnabled,
    },
    legend: {
      position: legendPosition,
    },
  };
}
