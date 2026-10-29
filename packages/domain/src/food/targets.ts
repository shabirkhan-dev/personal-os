import type { Activity, Goal, Macros } from "./model";

/**
 * Daily targets from the body numbers onboarding asked for. Calories are the Mifflin–St Jeor
 * resting estimate times an activity factor, moved up or down for the goal; protein is grams per
 * kilogram for that goal, fat about a quarter of calories and carbs the rest. Estimates to start
 * from, which the person can change; not medical advice.
 */

export type Body = {
	weightKg: number;
	heightCm: number;
	age: number;
	sex: "male" | "female" | null;
};

export type Targets = Macros & { waterMl: number };

const ACTIVITY_FACTOR: Record<Activity, number> = { light: 1.375, active: 1.55, very: 1.725 };

export const ACTIVITY_LABELS: Record<Activity, string> = {
	light: "lightly active",
	active: "active most days",
	very: "very active",
};

const GOAL_KCAL: Record<Goal, number> = {
	"lean-bulk": 350,
	maintain: 0,
	cut: -400,
	performance: 150,
};

const PROTEIN_PER_KG: Record<Goal, number> = {
	"lean-bulk": 2.15,
	maintain: 1.8,
	cut: 2.2,
	performance: 2,
};

/** One line under the targets: what the goal means week to week. */
export const GOAL_ADVICE: Record<Goal, string> = {
	"lean-bulk":
		"Aim for +0.3 to 0.5 kg a week so the gain stays lean. You can change these any time.",
	maintain: "Hold your weight within a kilo or so. You can change these any time.",
	cut: "Aim for −0.3 to 0.5 kg a week and keep protein high. You can change these any time.",
	performance: "A little over maintenance to fuel training. You can change these any time.",
};

export function restingKcal(body: Body): number {
	const base = 10 * body.weightKg + 6.25 * body.heightCm - 5 * body.age;
	if (body.sex === "male") return base + 5;
	if (body.sex === "female") return base - 161;
	return base - 78;
}

const roundTo = (value: number, step: number) => Math.round(value / step) * step;

export function targetsFor(body: Body, goal: Goal, activity: Activity): Targets {
	const kcal = roundTo(restingKcal(body) * ACTIVITY_FACTOR[activity] + GOAL_KCAL[goal], 50);
	const protein = roundTo(body.weightKg * PROTEIN_PER_KG[goal], 5);
	const fat = roundTo((kcal * 0.26) / 9, 5);
	const carbs = Math.max(0, roundTo((kcal - protein * 4 - fat * 9) / 4, 5));
	const water = goal === "lean-bulk" || goal === "performance" ? 3000 : 2500;
	return { kcal, protein, carbs, fat, waterMl: Math.max(water, roundTo(body.weightKg * 35, 250)) };
}

/** Where a weight goal should land: +10 kg for a bulk, −6 for a cut, otherwise the same. */
export function goalWeight(goal: Goal, weightKg: number): number {
	if (goal === "lean-bulk") return Math.round(weightKg + 10);
	if (goal === "cut") return Math.round(weightKg - 6);
	return Math.round(weightKg);
}

export function ageOn(birthday: { day: number; month: number; year: number }, now: Date): number {
	let age = now.getFullYear() - birthday.year;
	const before =
		now.getMonth() + 1 < birthday.month ||
		(now.getMonth() + 1 === birthday.month && now.getDate() < birthday.day);
	if (before) age -= 1;
	return Math.min(100, Math.max(14, age));
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

/** 0–1 share of a target reached, for bars. */
export function share(eaten: number, target: number): number {
	if (target <= 0) return eaten > 0 ? 1 : 0;
	return Math.min(1, Math.max(0, eaten / target));
}
