export type TransactionType = "expense" | "income";

export interface FinanceTransaction {
	id: string;
	type: TransactionType;
	amountMinor: number;
	currency: string;
	category: string | null;
	note: string | null;
	occurredOn: string; // YYYY-MM-DD
	createdAt: string;
	updatedAt: string;
}

export interface FinanceBudget {
	id: string;
	month: string; // YYYY-MM
	category: string;
	limitMinor: number;
}

export interface CategorySummary {
	category: string;
	spent: number;
	limit: number | null;
}

export interface MonthSummary {
	month: string;
	incomeTotal: number;
	expenseTotal: number;
	netTotal: number;
	categories: CategorySummary[];
}

export interface CreateTransactionInput {
	type: TransactionType;
	amountMinor: number;
	currency?: string;
	category?: string;
	note?: string;
	occurredOn?: string;
}

export interface UpdateTransactionInput {
	type?: TransactionType;
	amountMinor?: number;
	currency?: string;
	category?: string | null;
	note?: string | null;
	occurredOn?: string;
}

export interface TransactionsQuery {
	limit?: number;
	offset?: number;
	type?: TransactionType;
	category?: string;
	month?: string;
}

export interface SetBudgetsInput {
	budgets: Array<{
		category: string;
		limitMinor: number;
	}>;
}
