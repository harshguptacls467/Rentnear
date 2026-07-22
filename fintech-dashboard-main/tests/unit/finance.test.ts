import { describe, it, expect } from "vitest";
import { calculateSummary, buildExpenseChartData, applyTransactionFilters, sortTransactions } from "@/entities/transaction/api/transaction.service";
import type { Transaction } from "@/entities/transaction/model/types";

const transactions: Transaction[] = [
  { id: "1", title: "Зарплата", amount: 100000, category: "Зарплата", type: "Доход", date: "2026-04-01" },
  { id: "2", title: "Продукты", amount: 5000, category: "Еда", type: "Расход", date: "2026-04-05" },
  { id: "3", title: "Такси", amount: 1500, category: "Транспорт", type: "Расход", date: "2026-04-10" },
  { id: "4", title: "Аптека", amount: 2000, category: "Здоровье", type: "Расход", date: "2026-04-15" },
  { id: "5", title: "Кафе", amount: 3000, category: "Еда", type: "Расход", date: "2026-04-20" },
];

describe("calculateSummary", () => {
  it("calculates income, expenses and balance", () => {
    const result = calculateSummary(transactions);
    expect(result.income).toBe(100000);
    expect(result.expenses).toBe(11500);
    expect(result.balance).toBe(88500);
  });

  it("returns zeros for empty array", () => {
    const result = calculateSummary([]);
    expect(result.income).toBe(0);
    expect(result.expenses).toBe(0);
    expect(result.balance).toBe(0);
  });
});

describe("buildExpenseChartData", () => {
  it("groups expenses by category", () => {
    const result = buildExpenseChartData(transactions);
    expect(result).toHaveLength(3);
    const food = result.find((r) => r.name === "Еда");
    expect(food?.value).toBe(8000);
  });

  it("sorts by value descending", () => {
    const result = buildExpenseChartData(transactions);
    expect(result[0].value).toBeGreaterThanOrEqual(result[1].value);
    expect(result[1].value).toBeGreaterThanOrEqual(result[2].value);
  });

  it("returns empty array for income-only transactions", () => {
    const incomeOnly = transactions.filter((t) => t.type === "Доход");
    const result = buildExpenseChartData(incomeOnly);
    expect(result).toHaveLength(0);
  });
});

describe("applyTransactionFilters", () => {
  const defaultFilters = { search: "", fromDate: "", toDate: "", category: "все" as const, type: "все" as const };

  it("returns all transactions with default filters", () => {
    const result = applyTransactionFilters(transactions, defaultFilters);
    expect(result).toHaveLength(5);
  });

  it("filters by search query", () => {
    const result = applyTransactionFilters(transactions, { ...defaultFilters, search: "Такси" });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Такси");
  });

  it("filters by category", () => {
    const result = applyTransactionFilters(transactions, { ...defaultFilters, category: "Еда" });
    expect(result).toHaveLength(2);
  });

  it("filters by type", () => {
    const result = applyTransactionFilters(transactions, { ...defaultFilters, type: "Доход" });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Зарплата");
  });

  it("filters by date range", () => {
    const result = applyTransactionFilters(transactions, { ...defaultFilters, fromDate: "2026-04-10", toDate: "2026-04-20" });
    expect(result).toHaveLength(3);
  });
});

describe("sortTransactions", () => {
  it("sorts by date descending", () => {
    const result = sortTransactions(transactions);
    expect(result[0].date).toBe("2026-04-20");
    expect(result[result.length - 1].date).toBe("2026-04-01");
  });
});