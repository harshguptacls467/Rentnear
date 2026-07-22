"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { formatCurrency } from "@/shared/lib/money";

interface SavingsRateProps {
  income: number;      // доход за месяц
  expenses: number;    // расход за месяц
}

export function SavingsRate({ income, expenses }: SavingsRateProps) {
  const saved = income - expenses;
  const savingsRate = income > 0 ? (saved / income) * 100 : 0;
  const isGood = savingsRate >= 20;
  
  let rateColor = "text-rose-500";
  let advice = "Старайтесь откладывать хотя бы 20% дохода.";
  if (savingsRate >= 20) {
    rateColor = "text-emerald-500";
    advice = "Отлично! Вы превышаете норму сбережения.";
  } else if (savingsRate > 0) {
    rateColor = "text-amber-500";
    advice = "Неплохо, но можно больше.";
  }

  return (
    <Card className="shadow-soft border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50 !gap-0 !py-0">
      <CardHeader className="pb-1 px-3">
        <CardTitle className="text-sm">Процент сбережения</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 px-3 pt-1">
        <div className="text-xl font-bold dark:text-gray-200 sm:text-2xl">
          <span className={rateColor}>{savingsRate.toFixed(1)}%</span>
          <span className="text-xs text-muted-foreground ml-2">от дохода</span>
        </div>
        <div className="flex justify-between text-xs dark:text-gray-200">
          <span>Накоплено:</span>
          <span className="font-medium">{formatCurrency(saved)}</span>
        </div>
        <div className="flex justify-between text-xs dark:text-gray-200">
          <span>Доход за месяц:</span>
          <span>{formatCurrency(income)}</span>
        </div>
        <div className="text-[11px] text-muted-foreground p-1.5 bg-muted/30 rounded-md dark:bg-gray-700/50">
          💡 {advice}
        </div>
      </CardContent>
    </Card>
  );
}