"use client";

import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { transactionCategories, transactionTypes } from "@/entities/transaction/model/types";
import { useTransactionFiltersStore } from "@/features/transaction-filters/model/filter-store";
import type { TransactionCategory, TransactionType } from "@/entities/transaction/model/types";

export function FiltersBar() {
  const filters = useTransactionFiltersStore();

  return (
    <Card className="shadow-soft border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50 !gap-0 !py-0">
      <CardHeader className="pb-1 px-3">
        <CardTitle className="text-sm">Фильтры</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pt-1">
        <div className="flex flex-wrap items-end gap-2">
          <Input
            placeholder="Поиск"
            value={filters.search}
            onChange={(e) => filters.setSearch(e.target.value)}
            className="h-8 min-w-[140px] flex-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] leading-none text-muted-foreground dark:text-gray-400">От</span>
            <Input
              type="date"
              value={filters.fromDate}
              onChange={(e) => filters.setFromDate(e.target.value)}
              aria-label="Дата от"
              className="h-8 w-[130px] dark:bg-gray-900 dark:border-gray-700 dark:text-white [color-scheme:light]"
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] leading-none text-muted-foreground dark:text-gray-400">До</span>
            <Input
              type="date"
              value={filters.toDate}
              onChange={(e) => filters.setToDate(e.target.value)}
              aria-label="Дата до"
              className="h-8 w-[130px] dark:bg-gray-900 dark:border-gray-700 dark:text-white [color-scheme:light]"
            />
          </div>
          <Select value={filters.category} onValueChange={(v) => filters.setCategory(v as TransactionCategory | "все")}>
            <SelectTrigger className="h-8 w-[130px] dark:bg-gray-900 dark:border-gray-700 dark:text-white">
              <SelectValue placeholder="Категория" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="все">Все категории</SelectItem>
              {transactionCategories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.type} onValueChange={(v) => filters.setType(v as TransactionType | "все")}>
            <SelectTrigger className="h-8 w-[100px] dark:bg-gray-900 dark:border-gray-700 dark:text-white">
              <SelectValue placeholder="Тип" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="все">Все типы</SelectItem>
              {transactionTypes.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={filters.resetFilters} size="sm" className="h-8 whitespace-nowrap">
            Сбросить
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}