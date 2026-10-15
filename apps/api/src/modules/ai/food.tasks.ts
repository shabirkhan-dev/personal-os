import type { Config } from "@/config/env";
import { askJson } from "./ai.ask";
import {
	type AskFoodInput,
	type FoodAnswer,
	foodAnswer,
	type MealReading,
	mealReading,
	type ReadMealInput,
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
