"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { transactionRepository } from "@/entities/transaction/api/transaction.repository";
import { transactionKeys } from "@/entities/transaction/api/transaction.queries";

export function useDeleteTransactionMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => transactionRepository.delete(id),
    onError: () => {
      toast.error("Ошибка при удалении транзакции");
    },
    onSuccess: () => {
      toast.success("Транзакция удалена");
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    },
  });
}