import { asArray, asNumber, asString, isRecord } from "@/lib/storage/parse";
import { SLOTS, type Slot } from "./food-model";
import { RECIPE_TAGS, type Recipe, type RecipeTag } from "./recipes";

/**
 * The person's own recipes, as stored. Same shape as a bundled recipe, with their own photo,
 * video and note; `uses` is empty, so the grocery list takes their ingredients as they wrote them.
 */

const text = (value: unknown, max: number) => asString(value, "").trim().slice(0, max);
const count = (value: unknown, low: number, high: number, fallback: number) =>
	Math.min(high, Math.max(low, Math.round(asNumber(value, fallback))));
const grams = (value: unknown) =>
	Math.round(Math.min(2000, Math.max(0, asNumber(value, 0))) * 10) / 10;
const link = (value: unknown, pattern: RegExp) => {
	const out = text(value, 600);
	return pattern.test(out) ? out : null;
};

export function parseMyRecipe(raw: unknown): Recipe | null {
	if (!isRecord(raw)) return null;
	const id = text(raw.id, 60);
	const name = text(raw.name, 60);
	if (!id.startsWith("mine-") || !name) return null;
	const slots = asArray(raw.slots, (value) =>
		SLOTS.includes(value as Slot) ? (value as Slot) : null,
	);
	return {
		id,
		name,
		photo: "",
		image: link(raw.image, /^(file|https):\/\//),
		video: link(raw.video, /^https?:\/\//),
		note: text(raw.note, 400),
		mine: true,
		kind: text(raw.kind, 30) || "My recipe",
		slots: slots.length ? [...new Set(slots)] : ["dinner"],
		tags: asArray(raw.tags, (value) =>
			RECIPE_TAGS.includes(value as RecipeTag) ? (value as RecipeTag) : null,
		),
		minutes: count(raw.minutes, 1, 600, 30),
		serves: count(raw.serves, 1, 20, 2),
		cost: count(raw.cost, 0, 100_000, 0),
		kcal: Math.round(Math.min(5000, Math.max(0, asNumber(raw.kcal, 0)))),
		protein: grams(raw.protein),
		carbs: grams(raw.carbs),
		fat: grams(raw.fat),
		ingredients: asArray(raw.ingredients, (item) => {
			if (!isRecord(item)) return null;
			const ingredient = { name: text(item.name, 60), amount: text(item.amount, 30) };
			return ingredient.name ? ingredient : null;
		}).slice(0, 40),
		steps: asArray(raw.steps, (item) => {
			if (!isRecord(item)) return null;
			const step = text(item.text, 400);
			if (!step) return null;
			const minutes = asNumber(item.minutes, 0);
			return minutes > 0
				? { text: step, minutes: Math.min(600, Math.round(minutes)) }
				: { text: step };
		}).slice(0, 40),
		uses: [],
	};
}

/** A fresh id for a recipe the person writes. */
export const myRecipeId = () =>
	`mine-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/** An empty recipe to start the editor from. */
export function blankRecipe(slot: Slot = "dinner"): Recipe {
	return {
		id: myRecipeId(),
		name: "",
		photo: "",
		image: null,
		video: null,
		note: "",
		mine: true,
		kind: "My recipe",
		slots: [slot],
		tags: [],
		minutes: 30,
		serves: 2,
		cost: 0,
		kcal: 0,
		protein: 0,
		carbs: 0,
		fat: 0,
		ingredients: [],
		steps: [],
		uses: [],
	};
}
