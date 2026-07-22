import { InMemoryTransactionRepository } from "@/lib/repositories/in-memory-transaction.repository";
import { InMemoryBudgetRepository } from "@/lib/repositories/budget.repository";
import { TransactionService } from "@/lib/services/transaction.service";
import { BudgetService } from "@/lib/services/budget.service";
import type { Transaction } from "@/entities/transaction/model/types";
import seed from "@/data/transactions.json";

let transactionServiceInstance: TransactionService | null = null;
let budgetServiceInstance: BudgetService | null = null;

/**
 * Возвращает синглтон TransactionService.
 *
 * По умолчанию использует InMemoryTransactionRepository.
 * Для переключения на Prisma нужно реализовать PrismaTransactionRepository
 * и передать его сюда (например, через переменную окружения USE_PRISMA=true).
 */
export function getTransactionService(): TransactionService {
  if (!transactionServiceInstance) {
    const usePrisma = process.env.USE_PRISMA === "true";

    if (usePrisma) {
      // TODO: реализовать PrismaTransactionRepository
      throw new Error("Prisma repository not implemented yet — set USE_PRISMA=false or implement PrismaTransactionRepository");
    }

    const repository = new InMemoryTransactionRepository(seed as Transaction[]);
    transactionServiceInstance = new TransactionService(repository);
  }
  return transactionServiceInstance;
}

/**
 * Возвращает синглтон BudgetService.
 */
export function getBudgetService(): BudgetService {
  if (!budgetServiceInstance) {
    const budgetRepo = new InMemoryBudgetRepository();
    const transactionRepo = new InMemoryTransactionRepository(seed as Transaction[]);
    budgetServiceInstance = new BudgetService(budgetRepo, transactionRepo);
  }
  return budgetServiceInstance;
}

/**
 * Создаёт новый экземпляр TransactionService с указанным репозиторием.
 * Используется в тестах для подмены хранилища.
 */
export function createTransactionService(repository: InMemoryTransactionRepository): TransactionService {
  return new TransactionService(repository);
}