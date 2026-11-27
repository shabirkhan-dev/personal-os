import * as z from "zod";

/** The Food AI contract. Requests are strict; model answers are trimmed, not failed. */

export const slots = ["breakfast", "lunch", "snack", "dinner", "bed"] as const;

const text = (max: number) =>
	z
		.string()
		.default("")
		.transform((value) => value.trim().slice(0, max));

const amount = (max: number) => z.number().min(0).max(max).catch(0);

// --- read-meal -------------------------------------------------------------------------------

export const readMealSchema = z
	.object({
		text: z.string().trim().min(1).max(600),
	})
	.strict();

const mealItem = z.object({
	name: text(60).describe("Short and plain: 'Fried eggs', 'Chicken biryani'"),
	quantity: z.number().min(0.1).max(20).catch(1),
	unit: text(12).describe("'' for pieces, or cup, plate, bowl, glass, slice, g"),
	kcal: amount(5000).describe("For the whole quantity"),
	protein: amount(400).describe("Grams, for the whole quantity"),
	carbs: amount(800),
	fat: amount(400),
});

export const mealReading = z.object({
	items: z
		.array(mealItem)
		.default([])
		.transform((items) => items.filter((item) => item.name).slice(0, 12)),
	slot: z.enum(slots).nullable().catch(null),
});

// --- ask -------------------------------------------------------------------------------------

const macros = z
	.object({
		kcal: z.number().min(0).max(20_000),
		protein: z.number().min(0).max(2000),
		carbs: z.number().min(0).max(3000),
		fat: z.number().min(0).max(2000),
	})
	.strict();

export const askFoodSchema = z
	.object({
		question: z.string().trim().min(1).max(500),
		today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "The user's local date, YYYY-MM-DD"),
		goal: z.string().trim().max(30),
		targets: macros,
		eaten: macros,
		meals: z
			.array(z.object({ slot: z.enum(slots), names: z.string().trim().max(200) }).strict())
			.max(12)
			.default([]),
		recipes: z
			.array(
				z
					.object({ id: z.string().trim().min(1).max(40), name: z.string().trim().max(60) })
					.strict(),
			)
			.max(40)
			.default([]),
	})
	.strict();

export const foodAnswer = z.object({
	answer: text(900),
	/** One of the recipe ids given, when the answer suggests cooking it. */
	recipeId: z.string().trim().max(40).nullable().catch(null),
	followUps: z
		.array(z.string().transform((value) => value.trim().slice(0, 80)))
		.default([])
		.transform((items) => items.filter(Boolean).slice(0, 3)),
});

// --- draft-recipe --------------------------------------------------------------------------

export const draftRecipeSchema = z
	.object({
		name: z.string().trim().min(2).max(60),
		notes: z.string().trim().max(400).default(""),
		serves: z.number().int().min(1).max(12).default(2),
	})
	.strict();

export const recipeDraft = z.object({
	kind: text(30).describe("'Desi · dinner', 'Everyday · breakfast'"),
	slots: z
		.array(z.enum(slots).catch("dinner"))
		.default(["dinner"])
		.transform((items) => [...new Set(items)].slice(0, 3)),
	minutes: z.number().int().min(1).max(600).catch(30),
	kcal: amount(3000).describe("Per serving"),
	protein: amount(300).describe("Grams per serving"),
	carbs: amount(500),
	fat: amount(300),
	ingredients: z
		.array(z.object({ name: text(60), amount: text(24) }))
		.default([])
		.transform((items) => items.filter((item) => item.name).slice(0, 25)),
	steps: z
		.array(
			z.object({
				text: text(240),
				minutes: z.number().int().min(0).max(240).nullable().catch(null),
			}),
		)
		.default([])
		.transform((items) => items.filter((item) => item.text).slice(0, 20)),
});

// --- plan-week -------------------------------------------------------------------------------

export const planWeekSchema = z
	.object({
		goal: z.string().trim().max(30),
		targets: macros,
		/** What the person asked for: "more chicken, no fish, cheap weekdays". */
		wishes: z.string().trim().max(300).default(""),
		days: z
			.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
			.min(1)
			.max(7),
		recipes: z
			.array(
				z
					.object({
						id: z.string().trim().min(1).max(40),
						name: z.string().trim().max(60),
						slots: z.array(z.enum(slots)).max(5),
						kcal: z.number().min(0).max(5000),
						protein: z.number().min(0).max(400),
						cost: z.number().min(0).max(100_000),
					})
					.strict(),
			)
			.min(1)
			.max(80),
	})
	.strict();

export const weekPlanDraft = z.object({
	days: z
		.array(
			z.object({
				day: z.string().catch(""),
				meals: z
					.array(
						z.object({
							slot: z.enum(slots).catch("dinner"),
							recipeId: z.string().trim().max(40).catch(""),
							portions: z.number().min(0.5).max(4).catch(1),
						}),
					)
					.default([]),
			}),
		)
		.default([]),
	note: text(240),
});

export type ReadMealInput = z.infer<typeof readMealSchema>;
export type MealReading = z.infer<typeof mealReading>;
export type AskFoodInput = z.infer<typeof askFoodSchema>;
export type FoodAnswer = z.infer<typeof foodAnswer>;
export type DraftRecipeInput = z.infer<typeof draftRecipeSchema>;
export type RecipeDraft = z.infer<typeof recipeDraft>;
export type PlanWeekInput = z.infer<typeof planWeekSchema>;
export type WeekPlanDraft = z.infer<typeof weekPlanDraft>;
