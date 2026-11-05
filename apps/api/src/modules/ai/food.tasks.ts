import type { Config } from "@/config/env";
import { askJson } from "./ai.ask";
import {
	type AskFoodInput,
	type DraftRecipeInput,
	type FoodAnswer,
	foodAnswer,
	type MealReading,
	mealReading,
	type PlanWeekInput,
	type ReadMealInput,
	type RecipeDraft,
	recipeDraft,
	type WeekPlanDraft,
	weekPlanDraft,
} from "./food.schema";

type Deps = { config: Config };

/**
 * The Food module's AI tasks: reading a meal the phone couldn't match ("quinoa bowl with
 * hummus"), and answering "what should I eat". With the mock provider both answer from the input.
 */

const READ_MEAL =
	"Read what the person ate and list each food with its quantity and estimated calories, " +
	"protein, carbs and fat for the whole quantity, using typical home portions (Pakistani home " +
	"food when the dish is desi). If the line names a meal (breakfast, lunch, snack, dinner, " +
	"before bed) return it as `slot`, otherwise null. Never invent foods that aren't mentioned.";

export async function readMeal(deps: Deps, input: ReadMealInput): Promise<MealReading> {
	if (deps.config.ai.provider === "mock") return guessMeal(input.text);
	return askJson(deps.config, "Food", "read-meal", READ_MEAL, input.text, mealReading);
}

const GUIDANCE =
	"Answer a question about what to eat today, using the person's goal, daily targets and what " +
	"they have eaten so far. Prefer simple, affordable home food. When a recipe from the list " +
	"fits, name it and return its id as `recipeId`. Keep the answer under 80 words, give numbers " +
	"(grams of protein, kcal) when they help, and offer up to three short follow-up questions. " +
	"This is general guidance, not medical advice.";

export async function askFood(deps: Deps, input: AskFoodInput): Promise<FoodAnswer> {
	if (deps.config.ai.provider === "mock") {
		const left = Math.max(0, Math.round(input.targets.protein - input.eaten.protein));
		return {
			answer: `You asked “${input.question}”. You have ${left} g protein left today. With a provider key set, the answer appears here.`,
			recipeId: input.recipes[0]?.id ?? null,
			followUps: ["What about breakfast tomorrow?"],
		};
	}
	return askJson(deps.config, "Food", "food-ask", GUIDANCE, JSON.stringify(input), foodAnswer);
}

const DRAFT_RECIPE =
	"Write a simple home recipe for the dish named, the way it is usually cooked in a Pakistani " +
	"home when it is a desi dish. Give the ingredients with amounts for the servings asked, short " +
	"numbered steps (one action each, with minutes when there is waiting), the total minutes, the " +
	"meals it suits, and calories, protein, carbs and fat for one serving. Follow the person's " +
	"notes. Keep it honest: plain amounts, no brand names.";

export async function draftRecipe(deps: Deps, input: DraftRecipeInput): Promise<RecipeDraft> {
	if (deps.config.ai.provider === "mock") {
		return {
			kind: "Everyday · dinner",
			slots: ["dinner"],
			minutes: 30,
			kcal: 0,
			protein: 0,
			carbs: 0,
			fat: 0,
			ingredients: [{ name: input.name, amount: `${input.serves} servings` }],
			steps: [{ text: `Cook ${input.name.toLowerCase()} your usual way.`, minutes: null }],
		};
	}
	return askJson(
		deps.config,
		"Food",
		"draft-recipe",
		DRAFT_RECIPE,
		JSON.stringify(input),
		recipeDraft,
	);
}

const PLAN_WEEK =
	"Plan meals for each day given, choosing only recipes from the list by id, so each day lands " +
	"near the calorie and protein targets for the person's goal. Use each recipe's slots, prefer " +
	"variety across the week (no dish more than twice), keep weekday cost low, and follow the " +
	"person's wishes. Portions are 0.5 to 4. Add a one-sentence note on how the week was built.";

/** Keeps only days asked for and recipes that exist, in slot order. */
export function cleanPlan(input: PlanWeekInput, draft: WeekPlanDraft): WeekPlanDraft {
	const known = new Set(input.recipes.map((recipe) => recipe.id));
	const wanted = new Set(input.days);
	const order = ["breakfast", "lunch", "snack", "dinner", "bed"];
	return {
		days: draft.days
			.filter((day) => wanted.has(day.day))
			.map((day) => ({
				day: day.day,
				meals: day.meals
					.filter((meal) => known.has(meal.recipeId))
					.filter(
						(meal, index, list) => list.findIndex((other) => other.slot === meal.slot) === index,
					)
					.toSorted((a, b) => order.indexOf(a.slot) - order.indexOf(b.slot)),
			})),
		note: draft.note,
	};
}

export async function planWeek(deps: Deps, input: PlanWeekInput): Promise<WeekPlanDraft> {
	if (deps.config.ai.provider === "mock") {
		const pick = (slot: (typeof input.recipes)[number]["slots"][number]) =>
			input.recipes.find((recipe) => recipe.slots.includes(slot));
		return cleanPlan(input, {
			days: input.days.map((day) => ({
				day,
				meals: (["breakfast", "lunch", "dinner"] as const).flatMap((slot) => {
					const recipe = pick(slot);
					return recipe ? [{ slot, recipeId: recipe.id, portions: 1 }] : [];
				}),
			})),
			note: "The same simple day each day. With a provider key set, the week is planned here.",
		});
	}
	const draft = await askJson(
		deps.config,
		"Food",
		"plan-week",
		PLAN_WEEK,
		JSON.stringify(input),
		weekPlanDraft,
	);
	return cleanPlan(input, draft);
}

/** The mock's reading: each comma or "and" part becomes an item with no numbers. */
export function guessMeal(source: string): MealReading {
	const lower = source.toLowerCase();
	const slot = (["breakfast", "lunch", "snack", "dinner"] as const).find((name) =>
		lower.includes(name),
	);
	const items = source
		.split(/,|\band\b|\bwith\b/i)
		.map((part) => part.replace(/\b(breakfast|lunch|snack|dinner|i had|i ate|for)\b/gi, "").trim())
		.filter(Boolean)
		.slice(0, 12)
		.map((part) => {
			const count = /^(\d+)\s+/.exec(part);
			const name = count ? part.slice(count[0].length) : part;
			return {
				name: name.charAt(0).toUpperCase() + name.slice(1, 60),
				quantity: count ? Number(count[1]) : 1,
				unit: "",
				kcal: 0,
				protein: 0,
				carbs: 0,
				fat: 0,
			};
		});
	return { items, slot: slot ?? (lower.includes("before bed") ? "bed" : null) };
}
