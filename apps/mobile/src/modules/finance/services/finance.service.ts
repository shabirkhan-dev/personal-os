import { apiClient } from "@/lib/api/client";
import type {
	CreateTransactionInput,
	FinanceBudget,
	FinanceTransaction,
	MonthSummary,
	SetBudgetsInput,
	TransactionsQuery,
	UpdateTransactionInput,
} from "../types/finance.types";

export const financeService = {
	getSummary(month: string, accessToken: string): Promise<MonthSummary> {
		return apiClient.get<MonthSummary>(`/finance/summary/${encodeURIComponent(month)}`, {
			accessToken,
		});
	},

	getTransactions(
		query: TransactionsQuery = {},
		accessToken: string,
	): Promise<FinanceTransaction[]> {
		const params = new URLSearchParams();
		if (query.limit !== undefined) params.append("limit", String(query.limit));
		if (query.offset !== undefined) params.append("offset", String(query.offset));
		if (query.type) params.append("type", query.type);
		if (query.category) params.append("category", query.category);
		if (query.month) params.append("month", query.month);

		const queryString = params.toString();
		return apiClient.get<FinanceTransaction[]>(
			`/finance/transactions${queryString ? `?${queryString}` : ""}`,
			{ accessToken },
		);
	},

	createTransaction(
		input: CreateTransactionInput,
		accessToken: string,
	): Promise<FinanceTransaction> {
		return apiClient.post<FinanceTransaction>("/finance/transactions", input, { accessToken });
	},

	updateTransaction(
		id: string,
		input: UpdateTransactionInput,
		accessToken: string,
	): Promise<FinanceTransaction> {
		return apiClient.patch<FinanceTransaction>(
			`/finance/transactions/${encodeURIComponent(id)}`,
			input,
			{ accessToken },
		);
	},

	deleteTransaction(id: string, accessToken: string): Promise<{ id: string; deleted: boolean }> {
		return apiClient.delete<{ id: string; deleted: boolean }>(
			`/finance/transactions/${encodeURIComponent(id)}`,
			{ accessToken },
		);
	},

	getBudgets(month: string, accessToken: string): Promise<FinanceBudget[]> {
		return apiClient.get<FinanceBudget[]>(`/finance/budgets/${encodeURIComponent(month)}`, {
			accessToken,
		});
	},

	setBudgets(month: string, input: SetBudgetsInput, accessToken: string): Promise<FinanceBudget[]> {
		return apiClient.put<FinanceBudget[]>(`/finance/budgets/${encodeURIComponent(month)}`, input, {
			accessToken,
		});
	},
};
