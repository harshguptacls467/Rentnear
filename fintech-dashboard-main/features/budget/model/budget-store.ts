import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TransactionCategory } from "@/entities/transaction/model/types";

interface BudgetStore {
  budgets: Record<TransactionCategory, number>;
  setBudget: (category: TransactionCategory, limit: number) => void;
  getBudget: (category: TransactionCategory) => number;
}

export const useBudgetStore = create<BudgetStore>()(
  persist(
    (set, get) => ({
      budgets: {} as Record<TransactionCategory, number>,
      setBudget: (category, limit) => set((state) => ({
        budgets: { ...state.budgets, [category]: limit },
      })),
      getBudget: (category) => get().budgets[category] || 0,
    }),
    { name: "budget-storage" }
  )
);