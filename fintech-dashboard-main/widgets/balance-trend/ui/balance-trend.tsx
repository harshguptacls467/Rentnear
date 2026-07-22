"use client";

import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/shared/lib/money";
import type { Transaction } from "@/entities/transaction/model/types";

interface BalanceTrendProps {
  transactions: Transaction[];
}

export function BalanceTrend({ transactions }: BalanceTrendProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let runningBalance = 0;
  const data = sorted.map(t => {
    runningBalance += t.type === "Доход" ? t.amount : -t.amount;
    return { date: t.date, balance: runningBalance };
  });
  const unique = data.reduce((acc, curr) => {
    const existing = acc.find(item => item.date === curr.date);
    if (existing) existing.balance = curr.balance;
    else acc.push(curr);
    return acc;
  }, [] as typeof data);

  // Добавляем стартовую точку с нулевым балансом перед первой датой
  if (unique.length > 0) {
    unique.unshift({ date: unique[0].date, balance: 0 });
  }

  // Цвета для тёмной темы
  const gridColor = isDark ? "#334155" : "#e2e8f0";
  const textColor = isDark ? "#94a3b8" : "#64748b";
  const lineColor = isDark ? "#60a5fa" : "#0f172a";
  const tooltipBg = isDark ? "#1e293b" : "#ffffff";
  const tooltipText = isDark ? "#f1f5f9" : "#0f172a";

  return (
    <Card className="shadow-soft border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50 !gap-0 !py-0">
      <CardHeader className="pb-1 px-3">
        <CardTitle className="text-sm">Динамика баланса</CardTitle>
      </CardHeader>
      <CardContent className="h-[200px] px-3 pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={unique}>
            <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fill: textColor, fontSize: 12 }}
              stroke={gridColor}
            />
            <YAxis
              tickFormatter={(v) => formatCurrency(v).replace("RUB", "").trim()}
              tick={{ fill: textColor, fontSize: 12 }}
              stroke={gridColor}
            />
            <Tooltip
              formatter={(v) => formatCurrency(Number(v))}
              contentStyle={{ backgroundColor: tooltipBg, borderColor: gridColor, color: tooltipText }}
            />
            <Line type="monotone" dataKey="balance" stroke={lineColor} strokeWidth={2} dot={{ r: 3, fill: lineColor }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}