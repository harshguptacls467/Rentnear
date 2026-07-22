import type { TransactionRepository } from "@/entities/transaction/api/transaction.repository";
import type { NewTransactionInput, Transaction } from "@/entities/transaction/model/types";
import {
  applyTransactionFilters,
  calculateSummary,
  sortTransactions,
  buildExpenseChartData,
} from "@/entities/transaction/api/transaction.service";
import type {
  TransactionFilters,
  DashboardSummary,
  ExpenseChartItem,
} from "@/entities/transaction/api/transaction.service";

/**
 * TransactionService — бизнес-логика работы с транзакциями.
 * Не зависит от HTTP или БД — использует репозиторий.
 * Легко тестируется: в тестах передаём InMemoryTransactionRepository.
 */
export class TransactionService {
  constructor(private repository: TransactionRepository) {}

  async getAll(): Promise<Transaction[]> {
    return this.repository.list();
  }

  async getById(id: string): Promise<Transaction | null> {
    const all = await this.repository.list();
    return all.find((t) => t.id === id) ?? null;
  }

  async create(input: NewTransactionInput): Promise<Transaction> {
    return this.repository.create(input);
  }

  async update(id: string, input: Partial<NewTransactionInput>): Promise<Transaction> {
    return this.repository.update(id, input);
  }

  async delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  async deleteAll(): Promise<void> {
    return this.repository.deleteAll();
  }

  async reset(): Promise<Transaction[]> {
    return this.repository.reset();
  }

  // --- Методы с бизнес-логикой ---

  async getFiltered(filters: TransactionFilters): Promise<Transaction[]> {
    const all = await this.repository.list();
    return applyTransactionFilters(all, filters);
  }

  async getSorted(filters?: TransactionFilters): Promise<Transaction[]> {
    const transactions = filters
      ? await this.getFiltered(filters)
      : await this.repository.list();
    return sortTransactions(transactions);
  }

  async getSummary(filters?: TransactionFilters): Promise<DashboardSummary> {
    const transactions = filters
      ? await this.getFiltered(filters)
      : await this.repository.list();
    return calculateSummary(transactions);
  }

  async getExpenseChartData(filters?: TransactionFilters): Promise<ExpenseChartItem[]> {
    const transactions = filters
      ? await this.getFiltered(filters)
      : await this.repository.list();
    return buildExpenseChartData(transactions);
  }
}