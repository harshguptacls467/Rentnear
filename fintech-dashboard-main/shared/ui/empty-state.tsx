"use client";

import { Receipt } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";

interface EmptyStateProps {
  onAddTransaction?: () => void;
}

export function EmptyState({ onAddTransaction }: EmptyStateProps) {
  return (
    <div className="w-full">
      <Card className="shadow-soft border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <div className="rounded-full bg-muted/50 p-3 mb-3 dark:bg-gray-700/50">
            <Receipt className="h-8 w-8 text-muted-foreground dark:text-gray-400" />
          </div>
          <h3 className="text-base font-medium mb-2 dark:text-gray-200">Нет транзакций</h3>
          <p className="text-sm text-muted-foreground mb-4 dark:text-gray-400">
            Добавьте первую транзакцию
          </p>
          {onAddTransaction && (
            <Button onClick={onAddTransaction} size="sm">
              Добавить транзакцию
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}