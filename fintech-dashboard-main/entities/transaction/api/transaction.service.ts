import type { Transaction, TransactionCategory, TransactionType } from "../model/types";
import { isWithinDateRange } from "@/shared/lib/date";

export interface TransactionFilters {
  search: string;
  fromDate: string;
  toDate: string;
  category: TransactionCategory | "все";
  type: TransactionType | "все";
}

export interface DashboardSummary {
  balance: number;
  income: number;
  expenses: number;
}

export interface ExpenseChartItem {
  name: TransactionCategory;
  value: number;
}

export function sortTransactions(transactions: Transaction[]) {
  return [...transactions].sort((a, b) => b.date.localeCompare(a.date));
}

export function applyTransactionFilters(transactions: Transaction[], filters: TransactionFilters) {
  const search = filters.search.trim().toLowerCase();
  return transactions.filter((t) => {
    const matchesSearch =
      search === "" ||
      t.title.toLowerCase().includes(search) ||
      t.category.toLowerCase().includes(search);
    const matchesCategory = filters.category === "все" || t.category === filters.category;
    const matchesType = filters.type === "все" || t.type === filters.type;
    const matchesDate = isWithinDateRange(t.date, filters.fromDate || undefined, filters.toDate || undefined);
    return matchesSearch && matchesCategory && matchesType && matchesDate;
  });
}

export function calculateSummary(transactions: Transaction[]): DashboardSummary {
  const income = transactions.filter((t) => t.type === "Доход").reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === "Расход").reduce((sum, t) => sum + t.amount, 0);
  return { income, expenses, balance: income - expenses };
}

export function buildExpenseChartData(transactions: Transaction[]): ExpenseChartItem[] {
  const map = transactions
    .filter((t) => t.type === "Расход")
    .reduce<Record<TransactionCategory, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + t.amount;
      return acc;
    }, {} as Record<TransactionCategory, number>);
  return Object.entries(map)
    .map(([name, value]) => ({ name: name as TransactionCategory, value }))
    .sort((a, b) => b.value - a.value);
}