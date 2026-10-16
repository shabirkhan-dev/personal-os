import { useCallback, useMemo } from "react";
import { ApiError, apiClient } from "@/lib/api/client";
import { dayKey } from "@/lib/day";
import { useAuth } from "@/modules/auth";
import type { Category, Method } from "../lib/finance-model";

/** The Finance AI, `POST /ai/finance/<task>`. Needs a connection and a signed-in account. */

const AI_TIMEOUT_MS = 45_000;

export type FinanceAnswer = { answer: string; followUps: string[] };
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
	if (error instanceof ApiError) {
		if (error.statusCode === 0) return "You're offline. This needs a connection.";
		if (error.statusCode === 401) return "Sign in again to use AI.";
		if (error.statusCode === 408) return "That took too long. Try again.";
	}
	if (error instanceof Error && error.message === "signed-out") return "Sign in to use AI.";
	return "AI couldn't do that just now. Try again in a moment.";
}

export function useFinanceAi() {
	const { token, status } = useAuth();
	const available = status === "signed-in" && token !== null;

	const call = useCallback(
		async <T>(task: string, body: Record<string, unknown>): Promise<T> => {
			if (!available || !token) throw new Error("signed-out");
			return apiClient.post<T>(`/ai/finance/${task}`, body, {
				accessToken: token,
				timeoutMs: AI_TIMEOUT_MS,
			});
		},
		[available, token],
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
		}),
		[available, call],
	);
}
