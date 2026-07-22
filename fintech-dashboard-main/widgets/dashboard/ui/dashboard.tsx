"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTransactionsQuery } from "@/entities/transaction/api/transaction.queries";
import {
  applyTransactionFilters,
  buildExpenseChartData,
  calculateSummary,
  sortTransactions,
} from "@/entities/transaction/api/transaction.service";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 }
};
import { useTransactionFiltersStore } from "@/features/transaction-filters/model/filter-store";
import { BalanceCard } from "@/widgets/balance-card/ui/balance-card";
import { FiltersBar } from "@/widgets/filters-bar/ui/filters-bar";
import { TransactionTable } from "@/widgets/transaction-table/ui/transaction-table";
import { TransactionTableSkeleton } from "@/widgets/transaction-table/ui/transaction-table-skeleton";
import { AddTransactionForm } from "@/features/transaction-add/ui/add-transaction-form";
import { ThemeToggle } from "@/widgets/theme-toggle/ui/theme-toggle";
import { AuthButton } from "@/components/auth-button";
const BudgetCard = dynamic(() => import("@/widgets/budget-card/ui/budget-card").then(m => ({ default: m.BudgetCard })), { ssr: false });
import { TopCategories } from "@/widgets/top-categories/ui/top-categories";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Download, FileText } from "lucide-react";
import { AIInsight } from "@/widgets/ai-insight/ui/ai-insight";
import { KpiCards } from "@/widgets/kpi-cards/ui/kpi-cards";
import { CashFlowMonitor } from "@/features/cash-flow-monitor/ui/cash-flow-monitor";
import { SavingsRate } from "@/features/savings-rate/ui/savings-rate";
import { GoalTrackerSkeleton } from "@/shared/ui/goal-tracker-skeleton";

const BalanceTrend = dynamic(() => import("@/widgets/balance-trend/ui/balance-trend").then(m => ({ default: m.BalanceTrend })), { ssr: false });
const GoalTracker = dynamic(() => import("@/features/goal-tracker/ui/goal-tracker").then(m => ({ default: m.GoalTracker })), { ssr: false });
const DebtSafetyNet = dynamic(() => import("@/features/debt-safety/ui/debt-safety-net").then(m => ({ default: m.DebtSafetyNet })), { ssr: false });
import { GroupedExpenses } from "@/widgets/grouped-expenses/ui/grouped-expenses";
import { KpiCardsSkeleton } from "@/shared/ui/kpi-cards-skeleton";
import { BalanceCardSkeleton } from "@/shared/ui/balance-card-skeleton";
import { ExpenseChartSkeleton } from "@/shared/ui/expense-chart-skeleton";
import { BalanceTrendSkeleton } from "@/shared/ui/balance-trend-skeleton";
import { BudgetCardSkeleton } from "@/shared/ui/budget-card-skeleton";

const ExpenseChart = dynamic(() => import("@/widgets/expense-chart/ui/expense-chart").then(m => m.ExpenseChart), {
  ssr: false,
  loading: () => <div className="h-[320px] rounded-2xl border bg-muted/20" />,
});

export function Dashboard() {
  const { data = [], isLoading, error } = useTransactionsQuery();
  const filters = useTransactionFiltersStore();
  const filtered = applyTransactionFilters(data, filters);
  const sorted = sortTransactions(filtered);
  const summary = calculateSummary(sorted);
  const chartData = buildExpenseChartData(filtered);
  
  // Для месячных метрик (используем данные за текущий месяц)
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyTransactions = filtered.filter(t => t.date.startsWith(currentMonth));
  const monthlyIncome = monthlyTransactions.filter(t => t.type === "Доход").reduce((s, t) => s + t.amount, 0);
  const monthlyExpenses = monthlyTransactions.filter(t => t.type === "Расход").reduce((s, t) => s + t.amount, 0);
  const monthlyBalance = monthlyIncome - monthlyExpenses;

  const expensesByCategory = filtered
    .filter(t => t.type === "Расход")
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const exportToCSV = () => {
    const headers = ["ID", "Название", "Сумма (₽)", "Категория", "Тип", "Дата"];
    
    const escapeCSVField = (field: string | number): string => {
      const str = typeof field === "number" ? field.toFixed(2) : String(field);
      if (/[;"\n]/.test(str)) {
        return `"${str.replace(/"/g, `""`)}"`;
      }
      return str;
    };

    const rows = filtered.map(t => [
      t.id,
      t.title,
      Number(t.amount).toFixed(2),
      t.category,
      t.type,
      t.date
    ]);
    
    const csvContent = "\uFEFF" + [
      headers.map(escapeCSVField).join(";"),
      ...rows.map(row => row.map(escapeCSVField).join(";"))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute("download", `transactions_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    // Транслитерация для кириллицы (jsPDF не поддерживает русские шрифты без доп. загрузки)
    const tr = (s: string) =>
      s
        .replace(/[а-яё]/gi, (c) =>
          "абвгдеёжзийклмнопрстуфхцчшщъыьэюя"
            .split("")
            .reduce(
              (acc, r, i) =>
                acc.replace(
                  new RegExp(r, "gi"),
                  "abvgdeejziyklmnoprstufhccssyyeya"[i] +
                    (c === c.toUpperCase() && r !== "ъ" && r !== "ь" ? "" : ""),
                ),
              c,
            ),
        )
        .replace(/[А-ЯЁ]/g, (c) =>
          "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ"
            .split("")
            .reduce(
              (acc, r, i) =>
                acc.replace(r, "ABVGDEEJZIYKLMNOPRSTUFHCCSSYYEYA"[i]),
              c,
            ),
        );

    // Заголовок
    doc.setFontSize(16);
    doc.text(tr("FinTech Dashboard — Отчёт по транзакциям"), 14, 15);
    doc.setFontSize(10);
    doc.text(tr(`Дата: ${new Date().toLocaleDateString("ru-RU")}`), 14, 22);

    // Сводка
    doc.setFontSize(11);
    doc.text(tr(`Доходы: ${summary.income.toLocaleString("ru-RU")} rub`), 14, 30);
    doc.text(tr(`Расходы: ${summary.expenses.toLocaleString("ru-RU")} rub`), 80, 30);
    doc.text(tr(`Баланс: ${summary.balance.toLocaleString("ru-RU")} rub`), 146, 30);

    // Таблица
    const headers = [[tr("Название"), tr("Сумма (rub)"), tr("Категория"), tr("Тип"), tr("Дата")]];
    const rows = filtered.map((t) => [
      tr(t.title),
      Number(t.amount).toFixed(2),
      tr(t.category),
      tr(t.type),
      t.date,
    ]);

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    const dateStr = new Date().toISOString().slice(0, 10);
    doc.save(`transactions_${dateStr}.pdf`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <header className="mb-6 rounded-3xl border border-gray-200 bg-white p-4 shadow-soft dark:border-gray-700 dark:bg-gray-800 sm:mb-8 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-center gap-3">
              <Image src="/brand-mark.svg" alt="logo" width={40} height={40} priority className="h-10 w-10 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground dark:text-gray-400 truncate">Личный финансовый кабинет</p>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl truncate">FinTech Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" onClick={exportToCSV} size="sm" className="h-9 text-xs whitespace-nowrap">
                <Download className="mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">CSV</span>
              </Button>
              <Button variant="outline" onClick={exportToPDF} size="sm" className="h-9 text-xs whitespace-nowrap">
                <FileText className="mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
              <AuthButton />
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* KPI */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-6">
          {isLoading ? <KpiCardsSkeleton /> : (
            <KpiCards
              transactions={filtered}
              balance={summary.balance}
              income={monthlyIncome}
              expenses={monthlyExpenses}
            />
          )}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.3, delay: 0.1 }}
          className="grid gap-4 md:grid-cols-[1fr_0.8fr]"
        >
          {/* Левая колонка */}
          <div className="space-y-4 md:space-y-6">
            {/* 1-я строка: Монитор | Баланс */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }} className="grid gap-4 md:grid-cols-2">
              <div className="w-full"><CashFlowMonitor /></div>
              <div className="w-full">{isLoading ? <BalanceCardSkeleton /> : <BalanceCard summary={summary} />}</div>
            </motion.div>

            {/* 2-я строка: Структура расходов + Динамика баланса (слева) | Расходы по категориям (справа) */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }} className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-4">
                <div className="w-full"><GroupedExpenses transactions={filtered} /></div>
                <div className="w-full">{isLoading ? <BalanceTrendSkeleton /> : <BalanceTrend transactions={filtered} />}</div>
              </div>
              <div className="w-full">{isLoading ? <ExpenseChartSkeleton /> : <ExpenseChart data={chartData} />}</div>
            </motion.div>

            {/* 3-я строка: Процент сбережения */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 }} className="w-full"><SavingsRate income={monthlyIncome} expenses={monthlyExpenses} /></motion.div>

            {/* Фильтры (полная ширина) */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.5 }} className="w-full"><FiltersBar /></motion.div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.6 }}>
              {isLoading ? (
                <TransactionTableSkeleton />
              ) : error ? (
                <Card className="border-destructive/20 bg-destructive/5">
                  <CardContent className="p-6 text-destructive">Ошибка загрузки</CardContent>
                </Card>
              ) : (
                <div className="w-full"><TransactionTable transactions={sorted} onAddTransaction={() => document.getElementById("add-transaction-form")?.scrollIntoView({ behavior: "smooth" })} /></div>
              )}
            </motion.div>
          </div>

          {/* Правая колонка */}
          <div className="space-y-4 md:space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }} className="w-full"><AddTransactionForm /></motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.25 }} className="w-full">{isLoading ? <GoalTrackerSkeleton /> : <GoalTracker />}</motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.35 }} className="w-full"><DebtSafetyNet monthlyExpenses={monthlyExpenses} /></motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.45 }} className="w-full">{isLoading ? <BudgetCardSkeleton /> : <BudgetCard expensesByCategory={expensesByCategory} />}</motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.55 }} className="w-full"><TopCategories data={chartData} /></motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.65 }} className="w-full"><AIInsight /></motion.div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}