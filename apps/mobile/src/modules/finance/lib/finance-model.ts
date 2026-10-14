import type { ColorTokens } from "@personal-os/tokens";
import { asArray, asNumber, asString, isRecord, oneOf } from "@/lib/storage/parse";

export const EXPENSE_CATEGORIES = ["food", "shopping", "transport", "bills", "other"] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
	food: "Food",
	shopping: "Shopping",
	transport: "Transport",
	bills: "Bills",
	other: "Other",
};

/** Colours from the Figma "Spend Breakdown" widget. */
export const CATEGORY_TONES: Record<ExpenseCategory, keyof ColorTokens> = {
	food: "statusCaution",
	shopping: "statusViolet",
	transport: "accentDefault",
	bills: "statusSuccess",
	other: "textTertiary",
};

export type Expense = {
	id: string;
	amount: number;
	category: ExpenseCategory;
	note: string;
	/** ISO timestamp of when it was spent. */
	date: string;
	/** Receipt photo copied into the document directory. */
	receiptUri?: string;
};

export type SavingsContribution = { id: string; amount: number; date: string };

export type SavingsGoal = { target: number; contributions: SavingsContribution[] };

export type FinanceDoc = {
	expenses: Expense[];
	/** Monthly budget in rupees; null until the person sets one. */
	budget: number | null;
	goal: SavingsGoal | null;
};

export const initialFinance: FinanceDoc = { expenses: [], budget: null, goal: null };

function isValidDate(value: string): boolean {
	return value.length > 0 && !Number.isNaN(new Date(value).getTime());
}

function parseExpense(raw: unknown): Expense | null {
	if (!isRecord(raw)) return null;
	const id = asString(raw.id, "");
	const amount = asNumber(raw.amount, 0);
	const date = asString(raw.date, "");
	if (!id || amount <= 0 || !isValidDate(date)) return null;
	const receiptUri = asString(raw.receiptUri, "");
	return {
		id,
		amount,
		category: oneOf(raw.category, EXPENSE_CATEGORIES, "other"),
		note: asString(raw.note, ""),
		date,
		...(receiptUri ? { receiptUri } : {}),
	};
}

function parseContribution(raw: unknown): SavingsContribution | null {
	if (!isRecord(raw)) return null;
	const id = asString(raw.id, "");
	const amount = asNumber(raw.amount, 0);
	const date = asString(raw.date, "");
	if (!id || amount <= 0 || !isValidDate(date)) return null;
	return { id, amount, date };
}

function parseGoal(raw: unknown): SavingsGoal | null {
	if (!isRecord(raw)) return null;
	const target = asNumber(raw.target, 0);
	if (target <= 0) return null;
	return { target, contributions: asArray(raw.contributions, parseContribution) };
}

/** Reads the stored "finance" document; anything damaged falls back to empty. */
export function parseFinanceDoc(raw: unknown): FinanceDoc {
	if (!isRecord(raw)) return initialFinance;
	const budget = asNumber(raw.budget, 0);
	return {
		expenses: asArray(raw.expenses, parseExpense),
		budget: budget > 0 ? budget : null,
		goal: parseGoal(raw.goal),
	};
}
