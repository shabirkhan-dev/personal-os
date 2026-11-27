import { useCallback, useMemo } from "react";
import { useAi } from "@/lib/ai/use-ai";
import { ApiError } from "@/lib/api/client";
import { aiLimitMessage } from "@/lib/api/ai-limits";
import { dayKey } from "@/lib/day";
import type { Category, Method } from "../lib/finance-model";

/** The Finance AI, `POST /ai/finance/<task>`. Needs a connection and a signed-in account. */

const AI_TIMEOUT_MS = 45_000;

export type FinanceAnswer = { answer: string; followUps: string[] };

/** A budget drafted by AI: limits per line, the minimum list, and a few tips. */
export type BudgetDraftAi = {
	limits: Record<Category, number>;
	minimum: { label: string; amount: number }[];
	tips: string[];
	note: string;
};
export type SpendReading = {
	items: { name: string; amount: number; category: Category }[];
	method: Method | null;
};

export type FinanceContext = {
	balance: number;
	runwayDays: number | null;
	monthlyCost: number;
	monthlyIncome: number;
	spent: number;
	budget: number;
	lines: readonly { name: string; spent: number; limit: number }[];
	bills: readonly { name: string; amount: number; due: string }[];
	recent: readonly { day: string; title: string; amount: number; kind: "spend" | "income" }[];
};

export function financeAiMessage(error: unknown): string {
	const limit = aiLimitMessage(error);
	if (limit) return limit;
	if (error instanceof ApiError) {
		if (error.statusCode === 0) return "You're offline. This needs a connection.";
		if (error.statusCode === 401) return "Sign in again to use AI.";
		if (error.statusCode === 408) return "That took too long. Try again.";
	}
	if (error instanceof Error && error.message === "signed-out")
		return "Sign in, or add your own AI key in Settings.";
	return "AI couldn't do that just now. Try again in a moment.";
}

export function useFinanceAi() {
	const { available, run } = useAi();

	const call = useCallback(
		async <T>(task: string, body: Record<string, unknown>): Promise<T> => {
			if (!available) throw new Error("signed-out");
			return run<T>(`finance/${task}`, body, AI_TIMEOUT_MS);
		},
		[available, run],
	);

	return useMemo(
		() => ({
			available,
			ask: (question: string, context: FinanceContext) =>
				call<FinanceAnswer>("ask", {
					question: question.slice(0, 500),
					today: dayKey(new Date()),
					balance: Math.round(context.balance),
					runwayDays: context.runwayDays,
					monthlyCost: Math.round(context.monthlyCost),
					monthlyIncome: Math.round(context.monthlyIncome),
					spent: Math.round(context.spent),
					budget: Math.round(context.budget),
					lines: context.lines.slice(0, 8).map((line) => ({
						name: line.name.slice(0, 30),
						spent: Math.round(line.spent),
						limit: Math.round(line.limit),
					})),
					bills: context.bills.slice(0, 8).map((bill) => ({
						name: bill.name.slice(0, 40),
						amount: Math.round(bill.amount),
						due: bill.due,
					})),
					recent: context.recent.slice(0, 12).map((item) => ({
						day: item.day,
						title: item.title.slice(0, 60),
						amount: Math.round(item.amount),
						kind: item.kind,
					})),
				}),
			read: (text: string) => call<SpendReading>("read", { text: text.slice(0, 600) }),
			designBudget: (input: {
				monthlyCost: number;
				monthlyIncome: number;
				spent: Partial<Record<Category, number>>;
				notes: string;
			}) =>
				call<BudgetDraftAi>("design-budget", {
					monthlyCost: Math.max(0, Math.round(input.monthlyCost)),
					monthlyIncome: Math.max(0, Math.round(input.monthlyIncome)),
					spent: Object.fromEntries(
						Object.entries(input.spent).map(([key, value]) => [
							key,
							Math.max(0, Math.round(value ?? 0)),
						]),
					),
					notes: input.notes.slice(0, 400),
				}),
		}),
		[available, call],
	);
}
