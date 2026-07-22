import { z } from "zod";

export const transactionCategories = [
  "Еда",
  "Транспорт",
  "Покупки",
  "Здоровье",
  "Развлечения",
  "Зарплата",
  "Другое",
] as const;

export const transactionTypes = ["Доход", "Расход"] as const;

export type TransactionCategory = (typeof transactionCategories)[number];
export type TransactionType = (typeof transactionTypes)[number];

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: TransactionCategory;
  type: TransactionType;
  date: string;
}

export const transactionSchema = z.object({
  id: z.string(),
  title: z.string().min(2),
  amount: z.number().positive(),
  category: z.enum(transactionCategories),
  type: z.enum(transactionTypes),
  date: z.string().min(1),
});

export const newTransactionSchema = transactionSchema.omit({ id: true });
export type NewTransactionInput = z.infer<typeof newTransactionSchema>;

export const updateTransactionSchema = newTransactionSchema.partial();
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;