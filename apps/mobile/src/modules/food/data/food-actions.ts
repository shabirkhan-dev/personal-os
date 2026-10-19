import { listItems, removeItem, saveItem } from "@/lib/db/collection";
import { dayKey, newId } from "@/lib/day";
import { deleteJson, readJson } from "@/lib/storage/json-file";
import { asArray, asNumber, asString, isRecord, oneOf } from "@/lib/storage/parse";
import { generatePlan, groceriesFor, recipeItem } from "../lib/food-math";
import {
	type FoodItem,
	type FoodSettings,
	type GroceryItem,
	type GroceryList,
	type Meal,
	type PlanDay,
	type RecipeState,
	SLOT_TIMES,
	SLOTS,
	type Slot,
	type WeekPlan,
} from "../lib/food-model";
import { recipeById } from "../lib/recipes";
import {
	foodPlans,
	foodSettings,
	groceries,
	meals,
	recipeStates,
	water,
	weighIns,
} from "./collections";

/** Every Food write. Each saves to the record store, which refreshes the screens and syncs. */

/** `day` at `slot`'s usual time, or now when the slot is the current one. */
function timeFor(day: string, slot: Slot, now: Date): string {
	if (day === dayKey(now)) return now.toISOString();
	const minutes = SLOT_TIMES[slot];
	const date = new Date(`${day}T00:00:00`);
	date.setHours(Math.floor(minutes / 60), minutes % 60);
	return date.toISOString();
}

export async function logMeal(
	input: {
		slot: Slot;
		items: readonly FoodItem[];
		photo?: string | null;
		recipeId?: string | null;
		day?: string;
	},
	now = new Date(),
): Promise<Meal> {
	const day = input.day ?? dayKey(now);
	const meal: Meal = {
		id: newId(),
		day,
		slot: input.slot,
		items: [...input.items],
		photo: input.photo ?? null,
		planned: false,
		recipeId: input.recipeId ?? null,
		at: timeFor(day, input.slot, now),
	};
	await saveItem(meals, meal);
	return meal;
}

export function updateMeal(meal: Meal): Promise<void> {
	return saveItem(meals, meal);
}

export function deleteMeal(meal: Meal): Promise<void> {
	return removeItem(meals, meal.id);
}

/** Planned recipe → eaten. */
export function logRecipe(
	recipeId: string,
	slot: Slot,
	portions: number,
	now = new Date(),
): Promise<Meal> {
	const recipe = recipeById(recipeId);
	if (!recipe) return Promise.reject(new Error(`Unknown recipe ${recipeId}`));
	return logMeal({ slot, items: [recipeItem(recipe, portions)], recipeId }, now);
}

/** Water writes run one after another so each adds to the total the previous one saved. */
let waterQueue: Promise<unknown> = Promise.resolve();

/**
 * Adds `ml` (negative to take some back) to today's stored total, read fresh from the record store
 * so quick taps each count and an undo only takes back its own drink. Resolves to the new total.
 */
export function addWater(ml: number, now = new Date()): Promise<number> {
	const write = waterQueue.then(async () => {
		const id = dayKey(now);
		const stored = (await listItems(water)).find((item) => item.id === id)?.ml ?? 0;
		const next = Math.min(10_000, Math.max(0, stored + ml));
		await saveItem(water, { id, ml: next });
		return next;
	});
	// The caller sees the failure through `write`; the queue only needs to keep going.
	waterQueue = write.catch(() => undefined);
	return write;
}

export function weighIn(kg: number, now = new Date()): Promise<void> {
	return saveItem(weighIns, { id: dayKey(now), kg: Math.round(kg * 10) / 10 });
}

export function saveSettings(settings: FoodSettings): Promise<void> {
	return saveItem(foodSettings, settings);
}

export async function savePlan(
	weekId: string,
	days: readonly PlanDay[],
	now = new Date(),
): Promise<WeekPlan> {
	const plan: WeekPlan = { id: weekId, days: [...days], createdAt: now.toISOString() };
	await saveItem(foodPlans, plan);
	return plan;
}

/** Plans the week from `days`, keeping days already past. */
export function regeneratePlan(
	weekId: string,
	days: readonly string[],
	settings: FoodSettings,
	seed: number,
	current: WeekPlan | null,
	today: string,
): Promise<WeekPlan> {
	const keep = (day: string) =>
		day < today ? (current?.days.find((item) => item.day === day) ?? null) : null;
	return savePlan(weekId, generatePlan(days, settings.targets, seed, keep));
}

/** Puts `recipeId` into `slot` on `day` of the plan, creating the week if needed. */
export async function planRecipe(
	plan: WeekPlan | null,
	weekId: string,
	day: string,
	slot: Slot,
	recipeId: string,
	portions: number,
): Promise<void> {
	const days = plan?.days.some((item) => item.day === day)
		? (plan?.days ?? [])
		: [...(plan?.days ?? []), { day, meals: [] }];
	await savePlan(
		weekId,
		days.map((item) =>
			item.day === day
				? {
						day,
						meals: [
							...item.meals.filter((meal) => meal.slot !== slot),
							{ slot, recipeId, portions },
						].sort((a, b) => SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot)),
					}
				: item,
		),
	);
}

/** The shopping list for the plan's days from `fromDay`, keeping ticks already made. */
export async function makeGroceryList(
	plan: WeekPlan,
	fromDay: string,
	previous: GroceryList | null,
	now = new Date(),
): Promise<GroceryList> {
	const list: GroceryList = {
		id: plan.id,
		items: groceriesFor(
			plan.days.filter((day) => day.day >= fromDay),
			previous?.items ?? [],
		),
		createdAt: now.toISOString(),
	};
	await saveItem(groceries, list);
	return list;
}

export function saveGroceryItems(list: GroceryList, items: readonly GroceryItem[]): Promise<void> {
	return saveItem(groceries, { ...list, items: [...items] });
}

export function saveRecipeState(state: RecipeState): Promise<void> {
	return saveItem(recipeStates, state);
}

// --- the old single-file Food store ---------------------------------------------------------------

const OLD_SLOTS: Record<string, Slot> = {
	breakfast: "breakfast",
	lunch: "lunch",
	snack: "snack",
	dinner: "dinner",
};

/**
 * Moves what the first Food version kept in its "food" file (meals, water, hearted recipes) into
 * the record store, once, then removes the file. A meal there was one name with its calories.
 */
export async function migrateOldFood(): Promise<number> {
	const raw = await readJson("food");
	if (!isRecord(raw)) return 0;
	const old = asArray(raw.meals, (item) => {
		if (!isRecord(item)) return null;
		const day = asString(item.dayKey, "");
		const name = asString(item.name, "").trim();
		if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !name) return null;
		const meal: Meal = {
			id: asString(item.id, "") || newId(),
			day,
			slot: oneOf(asString(item.slot, ""), SLOTS, OLD_SLOTS[asString(item.slot, "")] ?? "snack"),
			items: [
				{
					name,
					quantity: 1,
					unit: "",
					foodId: null,
					kcal: Math.max(0, Math.round(asNumber(item.kcal, 0))),
					protein: Math.max(0, asNumber(item.protein, 0)),
					carbs: Math.max(0, asNumber(item.carbs, 0)),
					fat: Math.max(0, asNumber(item.fat, 0)),
				},
			],
			photo: typeof item.photoUri === "string" && item.photoUri ? item.photoUri : null,
			planned: item.planned === true,
			recipeId: null,
			at: asString(item.at, `${day}T12:00:00.000Z`),
		};
		return meal.planned ? null : meal;
	});
	const existing = new Set((await listItems(meals)).map((meal) => meal.id));
	const days = isRecord(raw.water) ? Object.entries(raw.water) : [];
	const hearts = asArray(raw.favourites, (id) => (typeof id === "string" ? id : null));
	await Promise.all([
		...old.filter((meal) => !existing.has(meal.id)).map((meal) => saveItem(meals, meal)),
		...days.flatMap(([day, ml]) => {
			const amount = asNumber(ml, 0);
			return /^\d{4}-\d{2}-\d{2}$/.test(day) && amount > 0
				? [saveItem(water, { id: day, ml: Math.round(amount) })]
				: [];
		}),
		...hearts
			.filter((id) => recipeById(id))
			.map((id) => saveItem(recipeStates, { id, saved: true, atHome: [] })),
	]);
	await deleteJson("food");
	return old.length;
}
