import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryTransactionRepository } from "@/lib/repositories/in-memory-transaction.repository";
import { TransactionService } from "@/lib/services/transaction.service";
import type { Transaction } from "@/entities/transaction/model/types";

const seedData: Transaction[] = [
  { id: "tx_1", title: "Зарплата", amount: 240000, category: "Зарплата", type: "Доход", date: "2026-04-10" },
  { id: "tx_2", title: "Продукты", amount: 8600, category: "Еда", type: "Расход", date: "2026-04-11" },
  { id: "tx_3", title: "Такси", amount: 1300, category: "Транспорт", type: "Расход", date: "2026-04-12" },
  { id: "tx_4", title: "Кино", amount: 1900, category: "Развлечения", type: "Расход", date: "2026-04-13" },
  { id: "tx_5", title: "Аптека", amount: 1450, category: "Здоровье", type: "Расход", date: "2026-04-14" },
];

describe("TransactionService", () => {
  let service: TransactionService;

  beforeEach(() => {
    const repo = new InMemoryTransactionRepository(seedData);
    service = new TransactionService(repo);
  });

  // --- CRUD ---

  it("should return all transactions", async () => {
    const all = await service.getAll();
    expect(all).toHaveLength(5);
  });

  it("should get transaction by id", async () => {
    const tx = await service.getById("tx_1");
    expect(tx).not.toBeNull();
    expect(tx!.title).toBe("Зарплата");
  });

  it("should return null for non-existent id", async () => {
    const tx = await service.getById("non_existent");
    expect(tx).toBeNull();
  });

  it("should create a new transaction", async () => {
    const created = await service.create({
      title: "Новая транзакция",
      amount: 5000,
      category: "Еда",
      type: "Расход",
      date: "2026-04-26",
    });
    expect(created.id).toBeDefined();
    expect(created.title).toBe("Новая транзакция");
    const all = await service.getAll();
    expect(all).toHaveLength(6);
  });

  it("should update a transaction", async () => {
    const updated = await service.update("tx_2", { amount: 10000 });
    expect(updated.amount).toBe(10000);
    expect(updated.title).toBe("Продукты"); // остальные поля не изменились
  });

  it("should throw on update non-existent transaction", async () => {
    await expect(service.update("bad_id", { amount: 100 })).rejects.toThrow("not found");
  });

  it("should delete a transaction", async () => {
    await service.delete("tx_3");
    const all = await service.getAll();
    expect(all).toHaveLength(4);
    expect(all.find((t) => t.id === "tx_3")).toBeUndefined();
  });

  it("should throw on delete non-existent transaction", async () => {
    await expect(service.delete("bad_id")).rejects.toThrow("not found");
  });

  it("should reset to seed data", async () => {
    await service.create({ title: "Temp", amount: 100, category: "Другое", type: "Расход", date: "2026-04-26" });
    await service.reset();
    const all = await service.getAll();
    expect(all).toHaveLength(5);
    expect(all[0].id).toBe("tx_1");
  });

  // --- Бизнес-логика ---

  it("should filter by search", async () => {
    const filtered = await service.getFiltered({
      search: "Такси",
      fromDate: "",
      toDate: "",
      category: "все",
      type: "все",
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe("Такси");
  });

  it("should filter by category", async () => {
    const filtered = await service.getFiltered({
      search: "",
      fromDate: "",
      toDate: "",
      category: "Еда",
      type: "все",
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe("Продукты");
  });

  it("should filter by type", async () => {
    const filtered = await service.getFiltered({
      search: "",
      fromDate: "",
      toDate: "",
      category: "все",
      type: "Доход",
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe("Зарплата");
  });

  it("should calculate summary", async () => {
    const summary = await service.getSummary();
    expect(summary.income).toBe(240000);
    expect(summary.expenses).toBe(8600 + 1300 + 1900 + 1450);
    expect(summary.balance).toBe(summary.income - summary.expenses);
  });

  it("should calculate summary with filters", async () => {
    const summary = await service.getSummary({
      search: "",
      fromDate: "",
      toDate: "",
      category: "все",
      type: "Расход",
    });
    expect(summary.income).toBe(0);
    expect(summary.expenses).toBe(8600 + 1300 + 1900 + 1450);
  });

  it("should build expense chart data", async () => {
    const chart = await service.getExpenseChartData();
    expect(chart).toHaveLength(4); // 4 категории расходов
    expect(chart.find((c) => c.name === "Еда")!.value).toBe(8600);
  });

  it("should sort transactions by date descending", async () => {
    const sorted = await service.getSorted();
    expect(sorted[0].date).toBe("2026-04-14");
    expect(sorted[sorted.length - 1].date).toBe("2026-04-10");
  });
});