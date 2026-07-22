import { z } from "zod";
import { transactionCategories, transactionTypes } from "@/entities/transaction/model/types";

export const transactionFormSchema = z.object({
  title: z.string().min(2, "Минимум 2 символа"),
  amount: z.coerce.number().positive("Сумма должна быть больше 0"),
  category: z.enum(transactionCategories),
  type: z.enum(transactionTypes),
  date: z.string().min(1, "Выберите дату"),
});

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;