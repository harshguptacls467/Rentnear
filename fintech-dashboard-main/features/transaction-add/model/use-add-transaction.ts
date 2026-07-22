"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { transactionRepository } from "@/entities/transaction/api/transaction.repository";
import { transactionKeys } from "@/entities/transaction/api/transaction.queries";
import type { NewTransactionInput, Transaction } from "@/entities/transaction/model/types";

export function useAddTransactionMutation() {
  const queryClient = useQueryClient();

  return useMutation<Transaction, Error, NewTransactionInput, { previousTransactions: Transaction[] }>({
    mutationFn: (input) => transactionRepository.create(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: transactionKeys.all });
      const previousTransactions = queryClient.getQueryData<Transaction[]>(transactionKeys.all) ?? [];
      const optimisticTransaction: Transaction = {
        id: `temp_${crypto.randomUUID()}`,
        ...input,
      };
      queryClient.setQueryData<Transaction[]>(transactionKeys.all, [optimisticTransaction, ...previousTransactions]);
      return { previousTransactions };
    },
    onError: (_err, _vars, context) => {
      if (context) {
        queryClient.setQueryData(transactionKeys.all, context.previousTransactions);
      }
      toast.error("Ошибка при добавлении транзакции");
    },
    onSuccess: () => {
      toast.success("Транзакция добавлена");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    },
  });
}