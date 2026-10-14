import { newId } from "@/lib/day";
import { createDocumentStore } from "@/lib/storage/document-store";
import { roundCents } from "../lib/finance-math";
import {
	type Expense,
	type ExpenseCategory,
	type FinanceDoc,
	initialFinance,
	parseFinanceDoc,
} from "../lib/finance-model";

/** Expenses, the monthly budget and the savings goal, saved on the phone as "finance.json". */
export const useFinanceStore = createDocumentStore("finance", initialFinance, parseFinanceDoc);

/** Applies a change once the saved document is loaded, so an early tap never overwrites it. */
function change(recipe: (current: FinanceDoc) => FinanceDoc): void {
	const store = useFinanceStore.getState();
	store
		.hydrate()
		.then(() => useFinanceStore.getState().update(recipe))
		.catch((error: unknown) => console.error("Could not update finance", error));
}

export type NewExpense = {
	amount: number;
	category: ExpenseCategory;
	note: string;
	receiptUri?: string;
};

export function addExpense(input: NewExpense, now: Date = new Date()): Expense {
	const expense: Expense = {
		id: newId(),
		amount: roundCents(input.amount),
		category: input.category,
		note: input.note.trim(),
		date: now.toISOString(),
		...(input.receiptUri ? { receiptUri: input.receiptUri } : {}),
	};
	change((doc) => ({ ...doc, expenses: [...doc.expenses, expense] }));
	return expense;
}

export function removeExpense(id: string): void {
	change((doc) => ({ ...doc, expenses: doc.expenses.filter((expense) => expense.id !== id) }));
}

export function setBudget(amount: number | null): void {
	change((doc) => ({ ...doc, budget: amount !== null && amount > 0 ? roundCents(amount) : null }));
}

export function setSavingsTarget(target: number): void {
	change((doc) => ({
		...doc,
		goal: { target: roundCents(target), contributions: doc.goal?.contributions ?? [] },
	}));
}

export function addSavings(amount: number, now: Date = new Date()): void {
	change((doc) =>
		doc.goal
			? {
					...doc,
					goal: {
						...doc.goal,
						contributions: [
							...doc.goal.contributions,
							{ id: newId(), amount: roundCents(amount), date: now.toISOString() },
						],
					},
				}
			: doc,
	);
}

export function removeSavingsGoal(): void {
	change((doc) => ({ ...doc, goal: null }));
}
