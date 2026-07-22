import type { TransactionRepository } from "@/entities/transaction/api/transaction.repository";
import type { NewTransactionInput, Transaction } from "@/entities/transaction/model/types";

/**
 * In-memory реализация TransactionRepository.
 * Используется для тестов и локальной разработки без БД.
 * Принимает seed-данные при создании.
 */
export class InMemoryTransactionRepository implements TransactionRepository {
  private transactions: Transaction[] = [];
  private readonly seedData: Transaction[];

  constructor(seed: Transaction[] = []) {
    this.seedData = structuredClone(seed);
    this.reset();
  }

  async list(): Promise<Transaction[]> {
    return [...this.transactions];
  }

  async create(input: NewTransactionInput): Promise<Transaction> {
    const created: Transaction = {
      id: crypto.randomUUID(),
      ...input,
    };
    this.transactions = [created, ...this.transactions];
    return created;
  }

  async update(id: string, input: Partial<NewTransactionInput>): Promise<Transaction> {
    const index = this.transactions.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Transaction with id "${id}" not found`);
    const updated: Transaction = { ...this.transactions[index], ...input };
    this.transactions = [
      ...this.transactions.slice(0, index),
      updated,
      ...this.transactions.slice(index + 1),
    ];
    return updated;
  }

  async delete(id: string): Promise<void> {
    const index = this.transactions.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Transaction with id "${id}" not found`);
    this.transactions = this.transactions.filter((t) => t.id !== id);
  }

  async deleteAll(): Promise<void> {
    this.transactions = [];
  }

  async reset(): Promise<Transaction[]> {
    this.transactions = structuredClone(this.seedData);
    return [...this.transactions];
  }
}