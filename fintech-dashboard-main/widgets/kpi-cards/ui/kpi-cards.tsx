"use client";

import { Card, CardContent } from "@/shared/ui/card";
import { cn } from "@/shared/lib/cn";
import { formatCurrency } from "@/shared/lib/money";
import { Gauge, Wallet, TrendingUp, TrendingDown, Receipt, ShoppingBag, AlertCircle, Info } from "lucide-react";
import type { Transaction } from "@/entities/transaction/model/types";

interface KpiCardsProps {
  transactions: Transaction[];
  balance: number;
  income: number;
  expenses: number;
}

export function KpiCards({ transactions, balance, income, expenses }: KpiCardsProps) {
  // Дополнительные метрики
  const totalTransactions = transactions.length;
  const expenseTransactions = transactions.filter(t => t.type === "Расход");
  const avgExpense = expenseTransactions.length > 0
    ? expenseTransactions.reduce((sum, t) => sum + t.amount, 0) / expenseTransactions.length
    : 0;
  const maxExpense = expenseTransactions.length > 0
    ? Math.max(...expenseTransactions.map(t => t.amount))
    : 0;

  const cards = [
    {
      title: "Общий баланс",
      value: formatCurrency(balance),
      icon: Wallet,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      title: "Доходы (месяц)",
      value: formatCurrency(income),
      icon: TrendingUp,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      title: "Расходы (месяц)",
      value: formatCurrency(expenses),
      icon: TrendingDown,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-950/30",
    },
    {
      title: "Всего операций",
      value: totalTransactions.toString(),
      icon: Receipt,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/30",
    },
    {
      title: "Средний чек",
      value: avgExpense > 0 ? formatCurrency(avgExpense) : "—",
      icon: ShoppingBag,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/30",
    },
    {
      title: "Макс. трата",
      value: maxExpense > 0 ? formatCurrency(maxExpense) : "—",
      icon: AlertCircle,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-950/30",
    },
  ];

  return (
    <div>
      {/* Заголовок блока KPI */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-primary flex-shrink-0" />
          <h2 className="text-lg font-semibold tracking-tight flex-1 min-w-0">KPI – Ключевые показатели</h2>
          <span
            title="Метрики пересчитываются автоматически при изменении фильтров (даты, категории, поиск). Показывают текущую финансовую ситуацию."
            className="cursor-help flex-shrink-0"
          >
            <Info className="h-4 w-4 text-muted-foreground" />
          </span>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">на основе фильтров</span>
      </div>

      {/* Сетка карточек KPI - 2 колонки на мобильных */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card
              key={idx}
              className="shadow-soft hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800"
            >
              <CardContent className="p-2 sm:p-3 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider line-clamp-1">
                    {card.title}
                  </span>
                  <div className={cn("p-1 rounded-[4px] sm:p-1.5 rounded-lg", card.bg)}>
                    <Icon className={cn("h-3 w-3 sm:h-3.5 sm:w-3.5", card.color)} />
                  </div>
                </div>
                <div className="text-base sm:text-lg font-bold tracking-tight text-gray-900 dark:text-white whitespace-nowrap overflow-hidden text-ellipsis">
                  {card.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}