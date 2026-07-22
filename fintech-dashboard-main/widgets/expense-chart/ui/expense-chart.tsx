"use client";

import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { formatCurrency } from "@/shared/lib/money";
import type { ExpenseChartItem } from "@/entities/transaction/api/transaction.service";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#0F172A", "#1D4ED8", "#7C3AED", "#059669", "#D97706", "#BE123C", "#475569"];
const DARK_COLORS = ["#94a3b8", "#60a5fa", "#a78bfa", "#34d399", "#fbbf24", "#f43f5e", "#94a3b8"];

export function ExpenseChart({ data }: { data: ExpenseChartItem[] }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const colors = isDark ? DARK_COLORS : COLORS;

  return (
    <Card className="shadow-soft border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50 !gap-0 !py-0">
      <CardHeader className="pb-1 px-3">
        <CardTitle className="text-sm">Расходы по категориям</CardTitle>
      </CardHeader>
      <CardContent className="h-[260px] sm:h-[320px] w-full px-3 pt-1">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground dark:text-gray-400 dark:border-gray-700">
            Нет расходов за выбранный период
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={110}
                innerRadius={62}
                paddingAngle={2}
              >
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{
                  backgroundColor: isDark ? "#1e293b" : "#ffffff",
                  borderColor: isDark ? "#334155" : "#e2e8f0",
                  color: isDark ? "#f1f5f9" : "#0f172a"
                }}
                labelStyle={{ color: isDark ? "#f1f5f9" : "#0f172a", fontWeight: 600 }}
                itemStyle={{ color: isDark ? "#f1f5f9" : "#0f172a" }}
              />
              <Legend
                wrapperStyle={{
                  color: isDark ? "#cbd5e1" : "#334155",
                  fontSize: "12px"
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}