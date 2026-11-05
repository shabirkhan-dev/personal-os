import { useCallback, useMemo } from "react";
import { ApiError, apiClient } from "@/lib/api/client";
import { aiLimitMessage } from "@/lib/api/ai-limits";
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

export type RecipeDraftAi = Macros & {
	kind: string;
	slots: Slot[];
	minutes: number;
	ingredients: { name: string; amount: string }[];
	steps: { text: string; minutes: number | null }[];
};

export type WeekPlanAi = {
	days: { day: string; meals: { slot: Slot; recipeId: string; portions: number }[] }[];
	note: string;
};

export function foodAiMessage(error: unknown): string {
	const limit = aiLimitMessage(error);
	if (limit) return limit;
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
			draftRecipe: (input: { name: string; notes: string; serves: number }) =>
				call<RecipeDraftAi>("draft-recipe", {
					name: input.name.slice(0, 60),
					notes: input.notes.slice(0, 400),
					serves: Math.min(12, Math.max(1, Math.round(input.serves))),
				}),
			planWeek: (input: {
				goal: string;
				targets: Macros;
				wishes: string;
				days: readonly string[];
				recipes: readonly {
					id: string;
					name: string;
					slots: Slot[];
					kcal: number;
					protein: number;
					cost: number;
				}[];
			}) =>
				call<WeekPlanAi>("plan-week", {
					...input,
					wishes: input.wishes.slice(0, 300),
					days: input.days.slice(0, 7),
					recipes: input.recipes.slice(0, 80),
				}),
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
