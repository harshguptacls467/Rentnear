"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { toast } from "sonner";
import { transactionCategories, type TransactionCategory } from "@/entities/transaction/model/types";
import { useBudgetStore } from "@/features/budget/model/budget-store";
import { formatCurrency } from "@/shared/lib/money";

interface BudgetCardProps {
  expensesByCategory: Record<TransactionCategory, number>;
}

export function BudgetCard({ expensesByCategory }: BudgetCardProps) {
  const { budgets, setBudget } = useBudgetStore();
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory>("Еда");
  const [limit, setLimit] = useState("");
  const [notifiedKey, setNotifiedKey] = useState<string>("");

  const handleSetBudget = () => {
    const numLimit = parseFloat(limit);
    if (!isNaN(numLimit) && numLimit > 0) {
      setBudget(selectedCategory, numLimit);
      setLimit("");
    }
  };

  const exceededKey = useMemo(() => {
    const exceeded = transactionCategories.filter((cat) => {
      const budget = budgets[cat];
      if (!budget || budget === 0) return false;
      const spent = expensesByCategory[cat] || 0;
      return (spent / budget) >= 1;
    }).sort().join("|");
    return exceeded || "";
  }, [budgets, expensesByCategory]);

  useEffect(() => {
    if (exceededKey && exceededKey !== notifiedKey) {
      const categories = exceededKey.split("|") as TransactionCategory[];
      const msg = categories.map(cat => {
        const budget = budgets[cat];
        const spent = expensesByCategory[cat] || 0;
        return `${cat}: ${formatCurrency(spent)} из ${formatCurrency(budget)}`;
      }).join(", ");
      setTimeout(() => {
        toast.warning(`Бюджет превышен! ${msg}`, { duration: 5000 });
      }, 500);
      setNotifiedKey(exceededKey);
    } else if (!exceededKey && notifiedKey) {
      setNotifiedKey("");
    }
  }, [exceededKey, budgets, expensesByCategory, notifiedKey]);

  return (
    <Card className="shadow-soft border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50 !gap-0 !py-0">
      <CardHeader className="pb-1 px-3">
        <CardTitle className="text-sm">Бюджеты по категориям</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5 px-3 pt-1">
        {/* Горизонтальная панель с переносом */}
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[120px]">
            <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as TransactionCategory)}>
              <SelectTrigger className="dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                <SelectValue placeholder="Категория" />
              </SelectTrigger>
              <SelectContent>
                {transactionCategories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-32">
            <Input
              type="number"
              placeholder="Лимит"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="dark:bg-gray-900 dark:border-gray-700 dark:text-white"
            />
          </div>
          <Button onClick={handleSetBudget}>Установить</Button>
        </div>

        {/* Список бюджетов */}
        <div className="space-y-2">
          {transactionCategories.map((cat) => {
            const budget = budgets[cat];
            if (!budget || budget === 0) return null;
            const spent = expensesByCategory[cat] || 0;
            const percent = Math.min(100, (spent / budget) * 100);
            const isWarning = percent >= 80 && percent < 100;
            const isDanger = percent >= 100;
            return (
              <div key={cat}>
                <div className="flex justify-between text-sm dark:text-gray-200">
                  <span>{cat}</span>
                  <span className={isDanger ? "text-destructive font-medium" : isWarning ? "text-amber-600 dark:text-amber-400" : ""}>
                    {formatCurrency(spent)} / {formatCurrency(budget)}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden dark:bg-gray-700">
                  <div 
                    className={`h-full transition-colors ${isDanger ? "bg-destructive" : isWarning ? "bg-amber-500" : "bg-primary"}`} 
                    style={{ width: `${percent}%` }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}