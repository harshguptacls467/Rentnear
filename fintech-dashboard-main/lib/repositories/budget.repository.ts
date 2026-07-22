import type { Budget, BudgetInput } from "@/entities/budget/model/types";

export interface BudgetRepository {
  getAll(): Promise<Budget[]>;
  setLimit(category: string, limit: number): Promise<Budget>;
  getByCategory(category: string): Promise<Budget | null>;
}

export class InMemoryBudgetRepository implements BudgetRepository {
  private budgets: Map<string, number> = new Map();

  async getAll(): Promise<Budget[]> {
    return Array.from(this.budgets.entries()).map(([category, limit]) => ({
      category,
      limit,
      spent: 0, // spent будет заполняться сервисом
    }));
  }

  async setLimit(category: string, limit: number): Promise<Budget> {
    this.budgets.set(category, limit);
    return { category, limit, spent: 0 };
  }

  async getByCategory(category: string): Promise<Budget | null> {
    const limit = this.budgets.get(category);
    if (limit === undefined) return null;
    return { category, limit, spent: 0 };
  }
}