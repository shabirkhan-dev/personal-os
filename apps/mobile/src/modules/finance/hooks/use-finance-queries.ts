import { useQuery } from "@tanstack/react-query";
import { financeService } from "../services/finance.service";
import type { TransactionsQuery } from "../types/finance.types";

export const financeKeys = {
	all: ["finance"] as const,
	summary: (month: string) => [...financeKeys.all, "summary", month] as const,
	transactions: (query?: TransactionsQuery) => [...financeKeys.all, "transactions", query] as const,
	budgets: (month: string) => [...financeKeys.all, "budgets", month] as const,
};

export function getCurrentMonthString(): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	return `${year}-${month}`;
}

export function useMonthSummaryQuery(month: string = getCurrentMonthString()) {
	return useQuery({
		queryKey: financeKeys.summary(month),
		queryFn: () => financeService.getSummary(month),
		staleTime: 30_000,
	});
}

export function useTransactionsQuery(query: TransactionsQuery = {}) {
	return useQuery({
		queryKey: financeKeys.transactions(query),
		queryFn: () => financeService.getTransactions(query),
		staleTime: 15_000,
	});
}

export function useBudgetsQuery(month: string = getCurrentMonthString()) {
	return useQuery({
		queryKey: financeKeys.budgets(month),
		queryFn: () => financeService.getBudgets(month),
		staleTime: 60_000,
	});
}
