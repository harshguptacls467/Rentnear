import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GoalStore {
  targetAmount: number;
  currentAmount: number;
  targetDate?: string; // опционально
  setTargetAmount: (amount: number) => void;
  setCurrentAmount: (amount: number) => void;
  setTargetDate: (date: string) => void;
  resetGoal: () => void;
}

export const useGoalStore = create<GoalStore>()(
  persist(
    (set) => ({
      targetAmount: 100000,
      currentAmount: 25000,
      targetDate: undefined,
      setTargetAmount: (targetAmount) => set({ targetAmount }),
      setCurrentAmount: (currentAmount) => set({ currentAmount }),
      setTargetDate: (targetDate) => set({ targetDate }),
      resetGoal: () => set({ targetAmount: 100000, currentAmount: 25000, targetDate: undefined }),
    }),
    { name: "goal-storage" }
  )
);