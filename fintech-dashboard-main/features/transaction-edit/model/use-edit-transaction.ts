"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionRepository } from "@/entities/transaction/api/transaction.repository";
import { transactionKeys } from "@/entities/transaction/api/transaction.queries";
import type { NewTransactionInput, Transaction } from "@/entities/transaction/model/types";

export function useEditTransactionMutation() {
  const queryClient = useQueryClient();

  return useMutation<Transaction, Error, { id: string; data: Partial<NewTransactionInput> }>({
    mutationFn: ({ id, data }) => transactionRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    },
  });
}