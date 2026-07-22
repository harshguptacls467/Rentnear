import { z } from "zod";
import { transactionCategories } from "@/entities/transaction/model/types";

export interface Budget {
  category: string;
  limit: number;
  spent: number;
}

export const budgetSchema = z.object({
  category: z.enum(transactionCategories),
  limit: z.number().positive(),
});

export type BudgetInput = z.infer<typeof budgetSchema>;