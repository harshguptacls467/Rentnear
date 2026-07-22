"use client";

import { useState } from "react";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Edit, Trash2, Utensils, Car, ShoppingBag, Heart, Film, Briefcase, MoreHorizontal } from "lucide-react";
import { formatCurrency } from "@/shared/lib/money";
import { formatDate } from "@/shared/lib/date";
import { cn } from "@/shared/lib/cn";
import type { Transaction } from "@/entities/transaction/model/types";
import { useDeleteTransactionMutation } from "@/features/transaction-delete/model/use-delete-transaction";
import { useDeleteAllTransactionsMutation, transactionKeys } from "@/entities/transaction/api/transaction.queries";
import { EditTransactionDialog } from "@/features/transaction-edit/ui/edit-transaction-dialog";
import ReactPaginate from "react-paginate";
import { EmptyState } from "@/shared/ui/empty-state";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface TransactionTableProps {
  transactions: Transaction[];
  onAddTransaction?: () => void;
}

const ITEMS_PER_PAGE = 5;

const categoryIcons: Record<string, typeof Utensils> = {
  "Еда": Utensils,
  "Транспорт": Car,
  "Покупки": ShoppingBag,
  "Здоровье": Heart,
  "Развлечения": Film,
  "Зарплата": Briefcase,
  "Другое": MoreHorizontal,
};

export function TransactionTable({ transactions, onAddTransaction }: TransactionTableProps) {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(0);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const { mutate: deleteTransaction } = useDeleteTransactionMutation();
  const { mutate: deleteAll } = useDeleteAllTransactionsMutation();

  const handleDeleteAll = () => {
    deleteAll(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: transactionKeys.all });
        toast.success("Все транзакции удалены");
        setDeletingAll(false);
      },
      onError: (error) => {
        toast.error(error.message || "Ошибка при удалении транзакций");
        setDeletingAll(false);
      },
    });
  };

  const pageCount = Math.ceil(transactions.length / ITEMS_PER_PAGE);
  const offset = currentPage * ITEMS_PER_PAGE;
  const currentTransactions = transactions.slice(offset, offset + ITEMS_PER_PAGE);

  const handlePageChange = ({ selected }: { selected: number }) => {
    setCurrentPage(selected);
  };

  return (
    <>
      <Card className="shadow-soft border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50 !gap-0 !py-0">
        <CardHeader className="pb-1 px-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm dark:text-gray-200">Последние транзакции</CardTitle>
          {transactions.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setDeletingAll(true)} className="text-destructive hover:text-destructive dark:text-red-400 dark:hover:text-red-300">
              <Trash2 className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline text-xs">Очистить</span>
            </Button>
          )}
        </CardHeader>
        <CardContent className="px-3 pt-1">
          {/* Десктоп: таблица */}
          <div className="hidden sm:block overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="dark:text-gray-200">Название</TableHead>
                <TableHead className="dark:text-gray-200">Категория</TableHead>
                <TableHead className="dark:text-gray-200">Дата</TableHead>
                <TableHead className="dark:text-gray-200">Тип</TableHead>
                <TableHead className="text-right dark:text-gray-200">Сумма</TableHead>
                <TableHead className="text-right dark:text-gray-200">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <EmptyState onAddTransaction={onAddTransaction} />
                  </TableCell>
                </TableRow>
              ) : currentTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center dark:text-gray-400">Нет данных</TableCell>
                </TableRow>
              ) : (
                currentTransactions.map((t) => (
                  <TableRow key={t.id} data-testid="transaction-row" className="dark:border-gray-700">
                    <TableCell className="font-medium dark:text-gray-200">{t.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const Icon = categoryIcons[t.category] || MoreHorizontal;
                          return <Icon className="h-4 w-4 text-muted-foreground dark:text-gray-400" />;
                        })()}
                        <span className="dark:text-gray-200">{t.category}</span>
                      </div>
                    </TableCell>
                    <TableCell className="dark:text-gray-200">{formatDate(t.date)}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium dark:bg-gray-700 dark:text-gray-200",
                        t.type === "Доход" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                      )}>
                        {t.type}
                      </span>
                    </TableCell>
                    <TableCell className={cn("text-right font-medium dark:text-gray-200", t.type === "Доход" ? "text-emerald-600" : "text-rose-600")}>
                      {t.type === "Расход" ? "-" : "+"}{formatCurrency(t.amount)}
                    </TableCell>
                    <TableCell className="text-right dark:text-gray-200">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setEditingTransaction(t)} aria-label="Редактировать транзакцию">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingTransaction(t)} aria-label="Удалить транзакцию">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            </Table>
          </div>

          {/* Мобильные: карточки */}
          <div className="sm:hidden space-y-2">
            {transactions.length === 0 ? (
              <EmptyState onAddTransaction={onAddTransaction} />
            ) : currentTransactions.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground dark:text-gray-400 py-4">Нет данных</div>
            ) : (
              currentTransactions.map((t) => (
                <div key={t.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700 dark:bg-gray-800/30">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm dark:text-gray-200 truncate">{t.title}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {(() => {
                          const Icon = categoryIcons[t.category] || MoreHorizontal;
                          return <Icon className="h-3.5 w-3.5 text-muted-foreground dark:text-gray-400" />;
                        })()}
                        <span className="text-[10px] dark:text-gray-200">{t.category}</span>
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium",
                          t.type === "Доход" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                        )}>
                          {t.type}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground dark:text-gray-400 mt-0.5">{formatDate(t.date)}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={cn("text-sm font-semibold", t.type === "Доход" ? "text-emerald-600" : "text-rose-600")}>
                        {t.type === "Расход" ? "-" : "+"}{formatCurrency(t.amount)}
                      </span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingTransaction(t)} aria-label="Редактировать транзакцию">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeletingTransaction(t)} aria-label="Удалить транзакцию">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {pageCount > 1 && (
            <div className="mt-3 flex justify-center">
              <ReactPaginate
                previousLabel={"←"}
                nextLabel={"→"}
                pageCount={pageCount}
                onPageChange={handlePageChange}
                containerClassName={"flex gap-1.5"}
                pageClassName={"rounded-md border px-2.5 py-1 text-xs dark:border-gray-700"}
                activeClassName={"bg-primary text-primary-foreground"}
                previousClassName={"rounded-md border px-2.5 py-1 text-xs dark:border-gray-700"}
                nextClassName={"rounded-md border px-2.5 py-1 text-xs dark:border-gray-700"}
                disabledClassName={"opacity-50"}
              />
            </div>
          )}
        </CardContent>
      </Card>
      <EditTransactionDialog
        open={!!editingTransaction}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
        transaction={editingTransaction}
      />
      <Dialog open={!!deletingTransaction} onOpenChange={(open) => !open && setDeletingTransaction(null)}>
        <DialogContent className="bg-white dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle>Удалить транзакцию?</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить "{deletingTransaction?.title}" на сумму {deletingTransaction && (deletingTransaction.type === "Расход" ? "-" : "+")}{deletingTransaction && formatCurrency(deletingTransaction.amount)}? Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingTransaction(null)}>Отмена</Button>
            <Button variant="destructive" onClick={() => {
              if (deletingTransaction) {
                deleteTransaction(deletingTransaction.id);
                setDeletingTransaction(null);
              }
            }}>Удалить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={deletingAll} onOpenChange={setDeletingAll}>
        <DialogContent className="bg-white dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle>Удалить все транзакции?</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить все {transactions.length} транзакций? Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingAll(false)}>Отмена</Button>
            <Button variant="destructive" onClick={handleDeleteAll}>Удалить все</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}