import { createDocumentStore } from "@/lib/storage/document-store";
import { asArray, asBoolean, asNumber, asString, isRecord, oneOf } from "@/lib/storage/parse";
import { MEAL_SLOTS, type Meal } from "../lib/meals";

/** Everything the Food module keeps on the phone. */
export type FoodDocument = {
	meals: Meal[];
	/** Water drunk per day key, in ml. */
	water: Record<string, number>;
	/** Saved (hearted) recipe ids. */
	favourites: string[];
	/** Recipe id → indexes of ingredients the person has at home. */
	pantry: Record<string, number[]>;
};

const initial: FoodDocument = { meals: [], water: {}, favourites: [], pantry: {} };

function optionalNumber(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function parseMeal(raw: unknown): Meal | null {
	if (!isRecord(raw)) return null;
	const id = asString(raw.id, "");
	const dayKey = asString(raw.dayKey, "");
	const name = asString(raw.name, "");
	if (!id || !dayKey || !name) return null;
	const meal: Meal = {
		id,
		dayKey,
		slot: oneOf(raw.slot, MEAL_SLOTS, "snack"),
		name,
		kcal: Math.max(0, asNumber(raw.kcal, 0)),
		at: asString(raw.at, new Date().toISOString()),
	};
	const protein = optionalNumber(raw.protein);
	const carbs = optionalNumber(raw.carbs);
	const fat = optionalNumber(raw.fat);
	if (protein !== undefined) meal.protein = protein;
	if (carbs !== undefined) meal.carbs = carbs;
	if (fat !== undefined) meal.fat = fat;
	if (typeof raw.photoUri === "string" && raw.photoUri) meal.photoUri = raw.photoUri;
	if (asBoolean(raw.planned, false)) meal.planned = true;
	if (typeof raw.recipeId === "string" && raw.recipeId) meal.recipeId = raw.recipeId;
	return meal;
}

function parseNumberRecord(raw: unknown): Record<string, number> {
	const out: Record<string, number> = {};
	if (!isRecord(raw)) return out;
	for (const [key, value] of Object.entries(raw)) {
		const ml = asNumber(value, -1);
		if (ml >= 0) out[key] = ml;
	}
	return out;
}

function parsePantry(raw: unknown): Record<string, number[]> {
	const out: Record<string, number[]> = {};
	if (!isRecord(raw)) return out;
	for (const [key, value] of Object.entries(raw)) {
		out[key] = asArray(value, (item) =>
			typeof item === "number" && Number.isInteger(item) ? item : null,
		);
	}
	return out;
}

export function parseFoodDocument(raw: unknown): FoodDocument {
	if (!isRecord(raw)) return initial;
	return {
		meals: asArray(raw.meals, parseMeal),
		water: parseNumberRecord(raw.water),
		favourites: asArray(raw.favourites, (item) => (typeof item === "string" ? item : null)),
		pantry: parsePantry(raw.pantry),
	};
}

export const useFoodStore = createDocumentStore<FoodDocument>("food", initial, parseFoodDocument);

/** Small named writes so screens never reshape the document themselves. */
export const foodActions = {
	addMeal(meal: Meal): void {
		useFoodStore.getState().update((doc) => ({ ...doc, meals: [...doc.meals, meal] }));
	},
	/** Replaces a meal by id (a planned dinner becoming eaten, an edit). */
	saveMeal(meal: Meal): void {
		useFoodStore.getState().update((doc) => {
			const exists = doc.meals.some((item) => item.id === meal.id);
			return {
				...doc,
				meals: exists
					? doc.meals.map((item) => (item.id === meal.id ? meal : item))
					: [...doc.meals, meal],
			};
		});
	},
	/** Saves an eaten meal; a plan waiting in the same slot that day is replaced by it. */
	logMeal(meal: Meal): void {
		useFoodStore.getState().update((doc) => {
			const others = doc.meals.filter(
				(item) =>
					item.id !== meal.id &&
					!(item.planned && item.dayKey === meal.dayKey && item.slot === meal.slot),
			);
			return { ...doc, meals: [...others, { ...meal, planned: undefined }] };
		});
	},
	removeMeal(id: string): void {
		useFoodStore
			.getState()
			.update((doc) => ({ ...doc, meals: doc.meals.filter((item) => item.id !== id) }));
	},
	/** Adds (or with a negative amount, removes) water for a day. */
	addWater(day: string, ml: number): void {
		useFoodStore.getState().update((doc) => ({
			...doc,
			water: { ...doc.water, [day]: Math.max(0, (doc.water[day] ?? 0) + ml) },
		}));
	},
	setWater(day: string, ml: number): void {
		useFoodStore
			.getState()
			.update((doc) => ({ ...doc, water: { ...doc.water, [day]: Math.max(0, ml) } }));
	},
	toggleFavourite(recipeId: string): void {
		useFoodStore.getState().update((doc) => ({
			...doc,
			favourites: doc.favourites.includes(recipeId)
				? doc.favourites.filter((id) => id !== recipeId)
				: [...doc.favourites, recipeId],
		}));
	},
	toggleIngredient(recipeId: string, index: number): void {
		useFoodStore.getState().update((doc) => {
			const current = doc.pantry[recipeId] ?? [];
			const next = current.includes(index)
				? current.filter((item) => item !== index)
				: [...current, index];
			return { ...doc, pantry: { ...doc.pantry, [recipeId]: next } };
		});
	},
};
