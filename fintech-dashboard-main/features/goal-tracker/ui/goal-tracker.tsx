"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { formatCurrency } from "@/shared/lib/money";
import { useGoalStore } from "../model/goal-store";
import { Target } from "lucide-react";

export function GoalTracker() {
  const { targetAmount, currentAmount, setTargetAmount, setCurrentAmount } = useGoalStore();
  const [editTarget, setEditTarget] = useState(false);
  const [newTarget, setNewTarget] = useState(targetAmount.toString());
  const [editCurrent, setEditCurrent] = useState(false);
  const [newCurrent, setNewCurrent] = useState(currentAmount.toString());

  const percent = Math.min(100, (currentAmount / targetAmount) * 100);
  const remaining = targetAmount - currentAmount;

  const handleSaveTarget = () => {
    const val = parseFloat(newTarget);
    if (!isNaN(val) && val > 0) setTargetAmount(val);
    setEditTarget(false);
  };

  const handleSaveCurrent = () => {
    const val = parseFloat(newCurrent);
    if (!isNaN(val) && val >= 0) setCurrentAmount(val);
    setEditCurrent(false);
  };

  return (
    <Card className="shadow-soft border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50 !gap-0 !py-0">
      <CardHeader className="pb-1 px-3">
        <CardTitle className="text-sm flex items-center gap-2 dark:text-gray-200">
          <Target className="h-4 w-4" />
          Финансовая цель
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-3 pt-1">
        <div className="flex justify-between items-center dark:text-gray-200">
          <span className="text-sm text-muted-foreground dark:text-gray-400">Накоплено:</span>
          {editCurrent ? (
            <div className="flex gap-1">
              <Input
                type="number"
                value={newCurrent}
                onChange={(e) => setNewCurrent(e.target.value)}
                className="w-28 h-8 text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              />
              <Button size="sm" onClick={handleSaveCurrent}>✅</Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-semibold">{formatCurrency(currentAmount)}</span>
              <Button variant="ghost" size="sm" onClick={() => setEditCurrent(true)}>✏️</Button>
            </div>
          )}
        </div>
        <div className="flex justify-between items-center dark:text-gray-200">
          <span className="text-sm text-muted-foreground dark:text-gray-400">Цель:</span>
          {editTarget ? (
            <div className="flex gap-1">
              <Input
                type="number"
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                className="w-28 h-8 text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              />
              <Button size="sm" onClick={handleSaveTarget}>✅</Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-semibold">{formatCurrency(targetAmount)}</span>
              <Button variant="ghost" size="sm" onClick={() => setEditTarget(true)}>✏️</Button>
            </div>
          )}
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs dark:text-gray-200">
            <span>Прогресс</span>
            <span>{percent.toFixed(0)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden dark:bg-gray-700">
            <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
          </div>
        </div>
        <div className="text-sm text-center dark:text-gray-200">
          Осталось: <strong>{formatCurrency(remaining)}</strong>
        </div>
        {targetAmount > 0 && currentAmount < targetAmount && (
          <div className="text-xs text-muted-foreground dark:text-gray-400 text-center">
            При темпе накоплений {formatCurrency(0)}/мес (пока не настроено)
          </div>
        )}
      </CardContent>
    </Card>
  );
}