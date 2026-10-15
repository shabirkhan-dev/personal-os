import { useCallback, useMemo } from "react";
import { ApiError, apiClient } from "@/lib/api/client";
import { dayKey } from "@/lib/day";
import { useAuth } from "@/modules/auth";
import type { Macros, Slot } from "../lib/food-model";

/** The Food AI, `POST /ai/food/<task>`. Needs a connection and a signed-in account. */

const AI_TIMEOUT_MS = 45_000;

export type MealReadingAi = {
	items: (Macros & { name: string; quantity: number; unit: string })[];
	slot: Slot | null;
};

export type FoodAnswer = { answer: string; recipeId: string | null; followUps: string[] };

export function foodAiMessage(error: unknown): string {
	if (error instanceof ApiError) {
		if (error.statusCode === 0) return "You're offline. This needs a connection.";
		if (error.statusCode === 401) return "Sign in again to use AI.";
		if (error.statusCode === 408) return "That took too long. Try again.";
	}
	if (error instanceof Error && error.message === "signed-out") return "Sign in to use AI.";
	return "AI couldn't do that just now. Try again in a moment.";
}

export function useFoodAi() {
	const { token, status } = useAuth();
	const available = status === "signed-in" && token !== null;

	const call = useCallback(
		async <T>(task: string, body: Record<string, unknown>): Promise<T> => {
			if (!available || !token) throw new Error("signed-out");
			return apiClient.post<T>(`/ai/food/${task}`, body, {
				accessToken: token,
				timeoutMs: AI_TIMEOUT_MS,
			});
		},
		[available, token],
	);

	return useMemo(
		() => ({
			available,
			readMeal: (text: string) => call<MealReadingAi>("read-meal", { text: text.slice(0, 600) }),
			ask: (input: {
				question: string;
				goal: string;
				targets: Macros;
				eaten: Macros;
				meals: readonly { slot: Slot; names: string }[];
				recipes: readonly { id: string; name: string }[];
			}) =>
				call<FoodAnswer>("ask", {
					...input,
					question: input.question.slice(0, 500),
					today: dayKey(new Date()),
					meals: input.meals
						.slice(0, 12)
						.map((meal) => ({ slot: meal.slot, names: meal.names.slice(0, 200) })),
					recipes: input.recipes.slice(0, 40),
				}),
		}),
		[available, call],
	);
}
