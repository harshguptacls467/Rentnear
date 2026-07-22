"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { formatCurrency } from "@/shared/lib/money";
import { useDebtSafetyStore } from "../model/debt-store";
import { ShieldAlert, HandCoins } from "lucide-react";

interface DebtSafetyNetProps {
  monthlyExpenses: number; // для расчёта нормы подушки (3-6 месяцев расходов)
}

export function DebtSafetyNet({ monthlyExpenses }: DebtSafetyNetProps) {
  const { debt, safetyNet, setDebt, setSafetyNet } = useDebtSafetyStore();
  const [editDebt, setEditDebt] = useState(false);
  const [newDebt, setNewDebt] = useState(debt.toString());
  const [editSafety, setEditSafety] = useState(false);
  const [newSafety, setNewSafety] = useState(safetyNet.toString());

  const idealSafetyMin = monthlyExpenses * 3;
  const idealSafetyMax = monthlyExpenses * 6;
  const isSafetyOk = safetyNet >= idealSafetyMin;
  const safetyStatus = isSafetyOk ? "✅ Норма" : "⚠️ Меньше нормы";

  const handleSaveDebt = () => {
    const val = parseFloat(newDebt);
    if (!isNaN(val) && val >= 0) setDebt(val);
    setEditDebt(false);
  };

  const handleSaveSafety = () => {
    const val = parseFloat(newSafety);
    if (!isNaN(val) && val >= 0) setSafetyNet(val);
    setEditSafety(false);
  };

  return (
    <Card className="shadow-soft border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50 !gap-0 !py-0">
      <CardHeader className="pb-1 px-3">
        <CardTitle className="text-sm flex items-center gap-2 dark:text-gray-200">
          <ShieldAlert className="h-4 w-4 text-rose-500 dark:text-rose-400" />
          Долги и подушка безопасности
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-3 pt-1">
        <div className="flex justify-between items-center dark:text-gray-200">
          <div className="flex items-center gap-2">
            <HandCoins className="h-4 w-4 text-rose-400 dark:text-rose-500" />
            <span className="text-sm">Текущий долг</span>
          </div>
          {editDebt ? (
            <div className="flex gap-1">
              <Input
                type="number"
                value={newDebt}
                onChange={(e) => setNewDebt(e.target.value)}
                className="w-28 h-8 text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              />
              <Button size="sm" onClick={handleSaveDebt}>✅</Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-rose-600 dark:text-rose-400">
                {debt > 0 ? `-${formatCurrency(debt)}` : formatCurrency(debt)}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setEditDebt(true)}>✏️</Button>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center dark:text-gray-200">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
            <span className="text-sm">Подушка безопасности</span>
          </div>
          {editSafety ? (
            <div className="flex gap-1">
              <Input
                type="number"
                value={newSafety}
                onChange={(e) => setNewSafety(e.target.value)}
                className="w-28 h-8 text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              />
              <Button size="sm" onClick={handleSaveSafety}>✅</Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-semibold">{formatCurrency(safetyNet)}</span>
              <Button variant="ghost" size="sm" onClick={() => setEditSafety(true)}>✏️</Button>
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground border-t pt-2 mt-2 dark:border-gray-700 dark:text-gray-400">
          <div>Норма подушки: {formatCurrency(idealSafetyMin)} – {formatCurrency(idealSafetyMax)}</div>
          <div className="mt-1">{safetyStatus}</div>
        </div>
      </CardContent>
    </Card>
  );
}