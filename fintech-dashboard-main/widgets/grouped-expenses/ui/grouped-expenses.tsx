"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { formatCurrency } from "@/shared/lib/money";
import type { Transaction } from "@/entities/transaction/model/types";

interface GroupedExpensesProps {
  transactions: Transaction[];
}

// Маппинг детальных категорий → крупные группы
const categoryMapping: Record<string, string> = {
  "Еда": "Жизнь",
  "Транспорт": "Жизнь",
  "Покупки": "Жизнь",
  "Здоровье": "Жизнь",
  "Развлечения": "Комфорт/Развлечения",
  "Зарплата": "Доходы (не расход)",
  "Другое": "Комфорт/Развлечения",
};

// Добавим отдельно группу "Обязательные платежи" – их нет в текущих категориях,
// но можно добавить отдельный ввод или считать из какой-то категории.
// Для демонстрации добавим статическую или возможность редактировать.
// Сделаем так: пользователь может ввести сумму обязательных платежей вручную через проп или стор.
// Для простоты покажем только три группы (исключим доходы).

export function GroupedExpenses({ transactions }: GroupedExpensesProps) {
  const expenses = transactions.filter(t => t.type === "Расход");
  
  const grouped: Record<string, number> = {
    "Обязательные платежи": 0, // пока можно ввести вручную, но лучше добавить UI
    "Жизнь": 0,
    "Комфорт/Развлечения": 0,
    "Сэкономленное/Инвестиции": 0,
  };

  // Агрегируем по группам согласно маппингу
  for (const exp of expenses) {
    const group = categoryMapping[exp.category];
    if (group && grouped[group] !== undefined) {
      grouped[group] += exp.amount;
    } else {
      // Неизвестные категории отправляем в "Комфорт/Развлечения"
      grouped["Комфорт/Развлечения"] += exp.amount;
    }
  }

  // Для демонстрации добавим возможность редактировать обязательные платежи через отдельный стор
  // Пока оставим 0, но можно добавить из глобального стора.
  // Для реального использования создайте store для обязательных платежей.

  return (
    <Card className="shadow-soft border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50 !gap-0 !py-0">
      <CardHeader className="pb-1 px-3">
        <CardTitle className="text-sm !leading-tight">Структура расходов</CardTitle>
      </CardHeader>
      <CardContent className="space-y-0.5 px-3 pt-1">
        {Object.entries(grouped).map(([name, amount]) => (
          <div key={name} className="flex justify-between items-center border-b border-gray-200 pb-0.5 last:border-0 last:pb-0 dark:border-gray-700">
            <span className="text-xs">{name}</span>
            <span className="text-xs font-medium">{formatCurrency(amount)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}