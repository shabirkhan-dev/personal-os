import { useMutation, useQueryClient } from "@tanstack/react-query";
import { financeService } from "../services/finance.service";
import type {
	CreateTransactionInput,
	SetBudgetsInput,
	UpdateTransactionInput,
} from "../types/finance.types";
import { financeKeys } from "./use-finance-queries";

export function useCreateTransactionMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: CreateTransactionInput) => financeService.createTransaction(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: financeKeys.all });
		},
	});
}

export function useUpdateTransactionMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, input }: { id: string; input: UpdateTransactionInput }) =>
			financeService.updateTransaction(id, input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: financeKeys.all });
		},
	});
}

export function useDeleteTransactionMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => financeService.deleteTransaction(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: financeKeys.all });
		},
	});
}

export function useSetBudgetsMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ month, input }: { month: string; input: SetBudgetsInput }) =>
			financeService.setBudgets(month, input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: financeKeys.all });
		},
	});
}
