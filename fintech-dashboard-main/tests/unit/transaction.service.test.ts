import { describe, expect, it } from "vitest";
import { applyTransactionFilters, buildExpenseChartData, calculateSummary, sortTransactions } from "@/entities/transaction/api/transaction.service";
import type { Transaction } from "@/entities/transaction/model/types";

const transactions: Transaction[] = [
  { id: "1", title: "Зарплата", amount: 200000, category: "Зарплата", type: "Доход", date: "2026-04-10" },
  { id: "2", title: "Такси", amount: 1200, category: "Транспорт", type: "Расход", date: "2026-04-12" },
  { id: "3", title: "Продукты", amount: 6400, category: "Еда", type: "Расход", date: "2026-04-11" },
];

describe("transaction service", () => {
  it("sorts by date desc", () => expect(sortTransactions(transactions)[0].date).toBe("2026-04-12"));
  it("calculates summary", () => expect(calculateSummary(transactions)).toEqual({ balance: 192400, income: 200000, expenses: 7600 }));
  it("filters by search and date", () => {
    const filtered = applyTransactionFilters(transactions, { search: "такс", fromDate: "2026-04-12", toDate: "2026-04-12", category: "все", type: "все" });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe("Такси");
  });
  it("builds expense chart data", () => expect(buildExpenseChartData(transactions)).toEqual([{ name: "Еда", value: 6400 }, { name: "Транспорт", value: 1200 }]));
});