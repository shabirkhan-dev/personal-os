import { waterGoalLiters } from "@/modules/onboarding/lib/insights";
import type { Macros } from "./meals";

export type FoodTargets = Macros & { waterMl: number };

/**
 * Daily targets from the plan: protein 1.6 g per kg, fat 25% of calories, carbs the rest, and the
 * onboarding water goal.
 */
export function foodTargets(calories: number, weightKg: number): FoodTargets {
	const kcal = Math.max(0, Math.round(calories));
	const protein = Math.round(weightKg * 1.6);
	const fat = Math.round((kcal * 0.25) / 9);
	const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
	return { kcal, protein, carbs, fat, waterMl: Math.round(waterGoalLiters(weightKg) * 1000) };
}

/** What is left of each target (never below zero). */
export function remaining(targets: Macros, eaten: Macros): Macros {
	return {
		kcal: Math.max(0, targets.kcal - eaten.kcal),
		protein: Math.max(0, targets.protein - eaten.protein),
		carbs: Math.max(0, targets.carbs - eaten.carbs),
		fat: Math.max(0, targets.fat - eaten.fat),
	};
}

/** 0–1 share of a target reached, for the macro bars. */
export function progress(eaten: number, target: number): number {
	if (target <= 0) return eaten > 0 ? 1 : 0;
	return Math.min(1, Math.max(0, eaten / target));
}
