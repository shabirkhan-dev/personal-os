import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/modules/auth";
import { financeService } from "../services/finance.service";
import type {
	CreateTransactionInput,
	SetBudgetsInput,
	UpdateTransactionInput,
} from "../types/finance.types";
import { financeKeys } from "./use-finance-queries";

export function useCreateTransactionMutation() {
	const queryClient = useQueryClient();
	const { token } = useAuth();

	return useMutation({
		mutationFn: (input: CreateTransactionInput) =>
			financeService.createTransaction(input, requireToken(token)),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: financeKeys.all });
		},
	});
}

export function useUpdateTransactionMutation() {
	const queryClient = useQueryClient();
	const { token } = useAuth();

	return useMutation({
		mutationFn: ({ id, input }: { id: string; input: UpdateTransactionInput }) =>
			financeService.updateTransaction(id, input, requireToken(token)),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: financeKeys.all });
		},
	});
}

export function useDeleteTransactionMutation() {
	const queryClient = useQueryClient();
	const { token } = useAuth();

	return useMutation({
		mutationFn: (id: string) => financeService.deleteTransaction(id, requireToken(token)),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: financeKeys.all });
		},
	});
}

export function useSetBudgetsMutation() {
	const queryClient = useQueryClient();
	const { token } = useAuth();

	return useMutation({
		mutationFn: ({ month, input }: { month: string; input: SetBudgetsInput }) =>
			financeService.setBudgets(month, input, requireToken(token)),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: financeKeys.all });
		},
	});
}

function requireToken(token: string | null): string {
	if (!token) throw new Error("Authentication required");
	return token;
}
