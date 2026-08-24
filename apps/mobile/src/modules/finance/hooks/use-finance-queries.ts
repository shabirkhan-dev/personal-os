import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/modules/auth";
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
	const { token, user } = useAuth();
	return useQuery({
		queryKey: [...financeKeys.summary(month), user?.id],
		queryFn: () => financeService.getSummary(month, requireToken(token)),
		enabled: Boolean(token && user),
		staleTime: 30_000,
	});
}

export function useTransactionsQuery(query: TransactionsQuery = {}) {
	const { token, user } = useAuth();
	return useQuery({
		queryKey: [...financeKeys.transactions(query), user?.id],
		queryFn: () => financeService.getTransactions(query, requireToken(token)),
		enabled: Boolean(token && user),
		staleTime: 15_000,
	});
}

export function useBudgetsQuery(month: string = getCurrentMonthString()) {
	const { token, user } = useAuth();
	return useQuery({
		queryKey: [...financeKeys.budgets(month), user?.id],
		queryFn: () => financeService.getBudgets(month, requireToken(token)),
		enabled: Boolean(token && user),
		staleTime: 60_000,
	});
}

function requireToken(token: string | null): string {
	if (!token) throw new Error("Authentication required");
	return token;
}
