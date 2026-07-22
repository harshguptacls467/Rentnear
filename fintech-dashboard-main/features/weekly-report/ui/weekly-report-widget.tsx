"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Loader2, TrendingUp, TrendingDown, Lightbulb, RefreshCw, Calendar } from "lucide-react";
import { http } from "@/shared/api/http-client";
import { cn } from "@/lib/utils";

interface WeekStats {
  income: number;
  expenses: number;
  balance: number;
  transactionCount: number;
  avgDailyExpenses: number;
  topCategories: [string, number][];
}

export function WeeklyReportWidget() {
  const [data, setData] = useState<{ weekStats: WeekStats; report: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await http<{ weekStats: WeekStats; report: string }>("/api/weekly-report");
      setData(result);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Еженедельный отчёт
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Еженедельный отчёт
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-4">
          <p className="text-muted-foreground mb-3">Не удалось загрузить отчёт</p>
          <Button variant="outline" size="sm" onClick={fetchReport}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Попробовать снова
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { weekStats, report } = data;
  const isPositive = weekStats.balance >= 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-5 w-5" />
          Еженедельный отчёт
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={fetchReport} className="h-8 w-8">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 rounded-lg bg-green-50 dark:bg-green-950">
            <p className="text-xs text-muted-foreground">Доходы</p>
            <p className="font-semibold text-green-600 dark:text-green-400">
              +{weekStats.income.toLocaleString('ru-RU')} ₽
            </p>
          </div>
          <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-950">
            <p className="text-xs text-muted-foreground">Расходы</p>
            <p className="font-semibold text-red-600 dark:text-red-400">
              -{weekStats.expenses.toLocaleString('ru-RU')} ₽
            </p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground">Баланс</p>
            <p className={cn("font-semibold", isPositive ? "text-green-600" : "text-red-600")}>
              {weekStats.balance.toLocaleString('ru-RU')} ₽
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <span className="font-medium">AI-анализ</span>
          </div>
          <div className="text-sm text-muted-foreground leading-relaxed bg-muted/50 p-3 rounded-lg">
            {report.split('\n').map((line, i) => {
              if (!line.trim()) return null;
              if (line.match(/^\d+\./)) {
                return <p key={i} className="font-medium mt-2 first:mt-0">{line}</p>;
              }
              return <p key={i}>{line}</p>;
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}