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

export type ReadMealInput = z.infer<typeof readMealSchema>;
export type MealReading = z.infer<typeof mealReading>;
export type AskFoodInput = z.infer<typeof askFoodSchema>;
export type FoodAnswer = z.infer<typeof foodAnswer>;
