import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";
import { formatCurrency } from "@/shared/lib/money";
import type { DashboardSummary } from "@/entities/transaction/api/transaction.service";

export function BalanceCard({ summary }: { summary: DashboardSummary }) {
  return (
    <Card className="shadow-soft border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50 !gap-0 !py-0 h-full">
      <CardHeader className="pb-1 px-3">
        <CardTitle className="text-sm">Баланс</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 px-3 pt-1">
        <div><p className="text-2xl font-semibold sm:text-3xl" data-testid="balance-value">{formatCurrency(summary.balance)}</p><p className="text-xs text-muted-foreground dark:text-gray-400">Текущий остаток</p></div>
        <Separator />
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><p className="text-muted-foreground dark:text-gray-400">Доходы</p><p className="font-medium text-emerald-600 dark:text-emerald-400" data-testid="income-value">{formatCurrency(summary.income)}</p></div>
          <div><p className="text-muted-foreground dark:text-gray-400">Расходы</p><p className="font-medium text-rose-600 dark:text-rose-400" data-testid="expenses-value">{formatCurrency(summary.expenses)}</p></div>
        </div>
      </CardContent>
    </Card>
  );
}