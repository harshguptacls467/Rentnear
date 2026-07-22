import type { BudgetRepository } from "@/lib/repositories/budget.repository";
import type { Budget } from "@/entities/budget/model/types";
import type { TransactionRepository } from "@/entities/transaction/api/transaction.repository";

/**
 * BudgetService — работа с лимитами по категориям.
 * Считает spent (сколько уже потрачено) на основе транзакций.
 */
export class BudgetService {
  constructor(
    private budgetRepo: BudgetRepository,
    private transactionRepo: TransactionRepository,
  ) {}

  async getAll(): Promise<Budget[]> {
    const budgets = await this.budgetRepo.getAll();
    const transactions = await this.transactionRepo.list();

    const expensesByCategory = new Map<string, number>();
    for (const t of transactions) {
      if (t.type === "Расход") {
        expensesByCategory.set(
          t.category,
          (expensesByCategory.get(t.category) ?? 0) + t.amount,
        );
      }
    }

    return budgets.map((b) => ({
      ...b,
      spent: expensesByCategory.get(b.category) ?? 0,
    }));
  }

  async setLimit(category: string, limit: number): Promise<Budget> {
    return this.budgetRepo.setLimit(category, limit);
  }

  async getByCategory(category: string): Promise<Budget | null> {
    const budget = await this.budgetRepo.getByCategory(category);
    if (!budget) return null;

    const transactions = await this.transactionRepo.list();
    const spent = transactions
      .filter((t) => t.type === "Расход" && t.category === category)
      .reduce((sum, t) => sum + t.amount, 0);

    return { ...budget, spent };
  }
}