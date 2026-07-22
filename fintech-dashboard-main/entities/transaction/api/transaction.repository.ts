import { http } from "@/shared/api/http-client";
import type { NewTransactionInput, Transaction } from "@/entities/transaction/model/types";

export interface TransactionRepository {
  list(): Promise<Transaction[]>;
  create(input: NewTransactionInput): Promise<Transaction>;
  update(id: string, input: Partial<NewTransactionInput>): Promise<Transaction>;
  delete(id: string): Promise<void>;
  deleteAll(): Promise<void>;
  reset(): Promise<Transaction[]>;
}

export class HttpTransactionRepository implements TransactionRepository {
  list() {
    return http<Transaction[]>("/api/transactions");
  }
  create(input: NewTransactionInput) {
    return http<Transaction>("/api/transactions", { method: "POST", body: JSON.stringify(input) });
  }
  update(id: string, input: Partial<NewTransactionInput>) {
    return http<Transaction>(`/api/transactions/${id}`, { method: "PATCH", body: JSON.stringify(input) });
  }
  delete(id: string) {
    return http<void>(`/api/transactions/${id}`, { method: "DELETE" });
  }
  deleteAll() {
    return http<void>("/api/transactions?action=deleteAll", { method: "POST" });
  }
  reset() {
    return http<Transaction[]>("/api/transactions/reset", { method: "POST" });
  }
}

export const transactionRepository = new HttpTransactionRepository();