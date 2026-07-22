"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Lightbulb } from "lucide-react";
import { useTransactionsQuery } from "@/entities/transaction/api/transaction.queries";
import { calculateSummary } from "@/entities/transaction/api/transaction.service";

export function AIInsight() {
  const { data: transactions = [] } = useTransactionsQuery();
  const [insight, setInsight] = useState("Загрузка совета...");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInsight = async () => {
      if (transactions.length === 0) {
        setInsight("Добавьте транзакции, чтобы получать персональные советы.");
        setIsLoading(false);
        return;
      }

      try {
        const summary = calculateSummary(transactions);
        const response = await fetch("/api/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactions, summary }),
        });
        const data = await response.json();
        setInsight(data.insight);
      } catch (error) {
        setInsight("Не удалось получить совет. Попробуйте позже.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsight();
  }, [transactions]);

  return (
    <Card className="shadow-soft bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 !gap-0 !py-0">
      <CardHeader className="pb-1 px-3">
        <CardTitle className="text-xs flex items-center gap-2 text-gray-900 dark:text-white">
          <Lightbulb className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
          Совет AI
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pt-1">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {isLoading ? "Анализирую данные..." : insight}
        </p>
      </CardContent>
    </Card>
  );
}