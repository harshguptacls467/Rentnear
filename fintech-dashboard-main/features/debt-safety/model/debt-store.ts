import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DebtSafetyStore {
  debt: number;           // текущий долг (друзья, кредиты)
  safetyNet: number;      // подушка безопасности (НЗ)
  setDebt: (debt: number) => void;
  setSafetyNet: (amount: number) => void;
}

export const useDebtSafetyStore = create<DebtSafetyStore>()(
  persist(
    (set) => ({
      debt: 0,
      safetyNet: 50000,
      setDebt: (debt) => set({ debt }),
      setSafetyNet: (safetyNet) => set({ safetyNet }),
    }),
    { name: "debt-safety-storage" }
  )
);