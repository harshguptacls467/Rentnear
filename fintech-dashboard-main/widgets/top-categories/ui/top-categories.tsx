"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { formatCurrency } from "@/shared/lib/money";
import type { ExpenseChartItem } from "@/entities/transaction/api/transaction.service";

export function TopCategories({ data }: { data: ExpenseChartItem[] }) {
  const top3 = [...data].sort((a,b) => b.value - a.value).slice(0,3);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return (
    <Card className="shadow-soft border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50 !gap-0 !py-0">
      <CardHeader className="pb-1 px-3">
        <CardTitle className="text-sm">Топ категории расходов</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 px-3 pt-1">
        {top3.map(item => {
          const percent = total ? (item.value / total) * 100 : 0;
          return (
            <div key={item.name} className="flex justify-between items-center dark:text-gray-200">
              <span>{item.name}</span>
              <span className="font-medium">{formatCurrency(item.value)} ({percent.toFixed(0)}%)</span>
            </div>
          );
        })}
        {top3.length === 0 && <div className="text-muted-foreground dark:text-gray-400">Нет данных</div>}
      </CardContent>
    </Card>
  );
}