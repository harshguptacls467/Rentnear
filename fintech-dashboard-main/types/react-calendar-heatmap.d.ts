declare module "react-calendar-heatmap" {
  import * as React from "react";

  interface CalendarHeatmapProps<T = unknown> {
    startDate: Date;
    end: Date;
    values: { date: string; value: T }[];
    classForValue: (value: { value: T } | undefined) => string;
    showWeekdayLabels?: boolean;
    gutterSize?: number;
    titleForValue?: (value: { value: T } | undefined) => string;
    onMouseOver?: (value: { value: T } | undefined) => void;
    onMouseLeave?: () => void;
  }

  export default function CalendarHeatmap<T = unknown>(props: CalendarHeatmapProps<T>): React.ReactElement;
}