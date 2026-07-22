"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transactionCategories, transactionTypes } from "@/entities/transaction/model/types";
import { useAddTransactionMutation } from "../model/use-add-transaction";
import { transactionFormSchema, type TransactionFormValues } from "../model/schema";
import { getTodayISO } from "@/shared/lib/date";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
export function AddTransactionForm() {
  const mutation = useAddTransactionMutation();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      title: "",
      amount: 0,
      category: "Еда",
      type: "Расход",
      date: getTodayISO(),
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    await mutation.mutateAsync(values);
    reset({
      title: "",
      amount: 0,
      category: "Еда",
      type: "Расход",
      date: getTodayISO(),
    });
  });

  return (
    <Card id="add-transaction-form" className="shadow-soft border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50 !gap-0 !py-0">
      <CardHeader className="pb-1 px-3">
        <CardTitle className="text-sm">Добавить транзакцию</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pt-1">
        <form onSubmit={onSubmit} className="grid gap-4" data-testid="transaction-form">
          <div className="grid gap-2">
            <label htmlFor="title" className="dark:text-gray-200">Название</label>
            <Input id="title" {...register("title")} className="dark:bg-gray-900 dark:border-gray-700 dark:text-white" />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="grid gap-2">
            <label htmlFor="amount" className="dark:text-gray-200">Сумма (₽)</label>
            <Input id="amount" type="number" step="any" {...register("amount")} className="dark:bg-gray-900 dark:border-gray-700 dark:text-white" />
            {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
          </div>

          <div className="grid gap-2">
            <label className="dark:text-gray-200">Категория</label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="dark:bg-gray-900 dark:border-gray-700 dark:text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {transactionCategories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid gap-2">
            <label className="dark:text-gray-200">Тип</label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="dark:bg-gray-900 dark:border-gray-700 dark:text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {transactionTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="date" className="dark:text-gray-200">Дата</label>
            <Input id="date" type="date" {...register("date")} className="w-full min-w-0 dark:bg-gray-900 dark:border-gray-700 dark:text-white [color-scheme:light]" />
            {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
          </div>

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Сохранение..." : "Добавить"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}