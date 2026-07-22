"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { formatCurrency } from "@/shared/lib/money";
import { Wallet, PiggyBank, CreditCard } from "lucide-react";

// В реальном приложении эти значения можно получать из отдельного хранилища
// Сейчас для демонстрации используем статические данные, но вы можете расширить
interface CashFlowMonitorProps {
  walletBalance?: number;      // деньги на карте/кошельке
  savingsBalance?: number;     // накопления
  creditCardDebt?: number;     // задолженность по кредитке
}

export function CashFlowMonitor({
  walletBalance = 15000,
  savingsBalance = 75000,
  creditCardDebt = 0
}: CashFlowMonitorProps) {
  return (
    <Card className="shadow-soft border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50 !gap-0 !py-0 h-full">
      <CardHeader className="pb-1 px-3">
        <CardTitle className="text-sm">Монитор денежных потоков</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 px-3 pt-1">
        <div className="flex items-center justify-between border-b border-gray-200 pb-1 last:border-0 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            <span className="text-xs">На карте / в кошельке</span>
          </div>
          <span className="text-xs font-medium">{formatCurrency(walletBalance)}</span>
        </div>
        <div className="flex items-center justify-between border-b border-gray-200 pb-1 last:border-0 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <PiggyBank className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
            <span className="text-xs">Накопления (копилка)</span>
          </div>
          <span className="text-xs font-medium">{formatCurrency(savingsBalance)}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-rose-500 dark:text-rose-400" />
            <span className="text-xs">Остаток по кредитке</span>
          </div>
          <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
            -{formatCurrency(creditCardDebt)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}