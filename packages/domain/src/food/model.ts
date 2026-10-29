import { asArray, asBoolean, asNumber, asString, isRecord, oneOf } from "../parse";

/**
 * Food's documents. Each type lives in its own record-store collection and is read back through
 * a `parse` function, so data from an older app version (or a damaged row) becomes a valid
 * value instead of crashing a screen.
 */

export const SLOTS = ["breakfast", "lunch", "snack", "dinner", "bed"] as const;
export type Slot = (typeof SLOTS)[number];

export const SLOT_LABELS: Record<Slot, string> = {
	breakfast: "Breakfast",
	lunch: "Lunch",
	snack: "Snack",
	dinner: "Dinner",
	bed: "Before bed",
};

/** When each slot usually happens (minutes after midnight), for planned times and the default slot. */
export const SLOT_TIMES: Record<Slot, number> = {
	breakfast: 8 * 60 + 10,
	lunch: 13 * 60,
	snack: 16 * 60 + 30,
	dinner: 20 * 60 + 30,
	bed: 22 * 60 + 30,
};

export type Macros = { kcal: number; protein: number; carbs: number; fat: number };

export const ZERO: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

/** One thing eaten: "Fried eggs × 2". Macros are for the whole quantity. */
export type FoodItem = Macros & {
	name: string;
	quantity: number;
	/** "", "cup", "plate", "g"… shown after the quantity. */
	unit: string;
	/** The food database entry it came from, so the quantity can be changed later. */
	foodId: string | null;
};

export type Meal = {
	id: string;
	/** "YYYY-MM-DD". */
	day: string;
	slot: Slot;
	items: FoodItem[];
	/** A photo of the plate, kept on the phone. */
	photo: string | null;
	/** Planned, not eaten yet. */
	planned: boolean;
	recipeId: string | null;
	/** When it was eaten (or is planned for). */
	at: string;
};

/** Water drunk on a day; the id is the day. */
export type WaterDay = { id: string; ml: number };

/** A weigh-in; the id is the day. */
export type WeighIn = { id: string; kg: number };

export const GOALS = ["lean-bulk", "maintain", "cut", "performance"] as const;
export type Goal = (typeof GOALS)[number];

export const GOAL_LABELS: Record<Goal, string> = {
	"lean-bulk": "Lean bulk",
	maintain: "Maintain",
	cut: "Cut",
	performance: "Performance",
};

export const ACTIVITY = ["light", "active", "very"] as const;
export type Activity = (typeof ACTIVITY)[number];

export type FoodSettings = {
	id: "settings";
	/** False until the person picks a goal. */
	setUp: boolean;
	goal: Goal;
	activity: Activity;
	targets: Macros & { waterMl: number };
	/** Weight the goal started from and aims for. */
	startKg: number;
	goalKg: number;
	/** "YYYY-MM-DD" the goal started, for "week 3". */
	startedOn: string;
	/** 0 = Sunday … 6 = Saturday. */
	weighInDay: number;
	/** Rupees a week for groceries. */
	weeklyBudget: number;
};

export type PlannedMeal = { slot: Slot; recipeId: string; portions: number };
export type PlanDay = { day: string; meals: PlannedMeal[] };

/** A week of planned meals; the id is that week's first day. */
export type WeekPlan = { id: string; days: PlanDay[]; createdAt: string };

export const GROCERY_SECTIONS = ["protein", "carbs", "veg", "extras"] as const;
export type GrocerySection = (typeof GROCERY_SECTIONS)[number];

export const SECTION_LABELS: Record<GrocerySection, string> = {
	protein: "Protein",
	carbs: "Carbs and fruit",
	veg: "Vegetables and spices",
	extras: "Extras",
};

export type GroceryItem = {
	id: string;
	name: string;
	/** "1 kg", "30", "1 dozen". */
	amount: string;
	section: GrocerySection;
	price: number;
	bought: boolean;
	atHome: boolean;
};

/** The shopping list for a plan; the id is the plan's week. */
export type GroceryList = { id: string; items: GroceryItem[]; createdAt: string };

/** What the person keeps per recipe: saved, and which ingredients are at home. */
export type RecipeState = { id: string; saved: boolean; atHome: number[] };

// --- parsing ------------------------------------------------------------------------------------

const DAY = /^\d{4}-\d{2}-\d{2}$/;

function asDay(value: unknown): string | null {
	return typeof value === "string" && DAY.test(value) ? value : null;
}

function asIso(value: unknown, fallback: string): string {
	return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : fallback;
}

const positive = (value: unknown, fallback = 0) => Math.max(0, asNumber(value, fallback));

function parseMacros(raw: Record<string, unknown>): Macros {
	return {
		kcal: Math.round(positive(raw.kcal)),
		protein: Math.round(positive(raw.protein) * 10) / 10,
		carbs: Math.round(positive(raw.carbs) * 10) / 10,
		fat: Math.round(positive(raw.fat) * 10) / 10,
	};
}

export function parseItem(raw: unknown): FoodItem | null {
	if (!isRecord(raw)) return null;
	const name = asString(raw.name, "").trim();
	if (!name) return null;
	return {
		name,
		quantity: Math.max(0.1, asNumber(raw.quantity, 1)),
		unit: asString(raw.unit, ""),
		foodId: typeof raw.foodId === "string" && raw.foodId ? raw.foodId : null,
		...parseMacros(raw),
	};
}

export function parseMeal(raw: unknown): Meal | null {
	if (!isRecord(raw)) return null;
	const id = asString(raw.id, "");
	const day = asDay(raw.day);
	const items = asArray(raw.items, parseItem);
	if (!id || !day || items.length === 0) return null;
	return {
		id,
		day,
		slot: oneOf(raw.slot, SLOTS, "snack"),
		items,
		photo: typeof raw.photo === "string" && /^(file|https):\/\//.test(raw.photo) ? raw.photo : null,
		planned: asBoolean(raw.planned, false),
		recipeId: typeof raw.recipeId === "string" && raw.recipeId ? raw.recipeId : null,
		at: asIso(raw.at, `${day}T12:00:00.000Z`),
	};
}

export function parseWater(raw: unknown): WaterDay | null {
	if (!isRecord(raw)) return null;
	const id = asDay(raw.id);
	return id ? { id, ml: Math.min(10_000, Math.round(positive(raw.ml))) } : null;
}

export function parseWeighIn(raw: unknown): WeighIn | null {
	if (!isRecord(raw)) return null;
	const id = asDay(raw.id);
	const kg = asNumber(raw.kg, 0);
	return id && kg > 20 && kg < 400 ? { id, kg: Math.round(kg * 10) / 10 } : null;
}

export function defaultSettings(): FoodSettings {
	return {
		id: "settings",
		setUp: false,
		goal: "maintain",
		activity: "active",
		targets: { kcal: 2200, protein: 120, carbs: 260, fat: 65, waterMl: 2500 },
		startKg: 70,
		goalKg: 70,
		startedOn: "2026-01-01",
		weighInDay: 5,
		weeklyBudget: 5500,
	};
}

export function parseSettings(raw: unknown): FoodSettings | null {
	if (!isRecord(raw)) return null;
	const base = defaultSettings();
	const targets = isRecord(raw.targets) ? raw.targets : {};
	return {
		id: "settings",
		setUp: asBoolean(raw.setUp, false),
		goal: oneOf(raw.goal, GOALS, base.goal),
		activity: oneOf(raw.activity, ACTIVITY, base.activity),
		targets: {
			kcal: Math.round(positive(targets.kcal, base.targets.kcal)) || base.targets.kcal,
			protein: Math.round(positive(targets.protein, base.targets.protein)),
			carbs: Math.round(positive(targets.carbs, base.targets.carbs)),
			fat: Math.round(positive(targets.fat, base.targets.fat)),
			waterMl: Math.round(positive(targets.waterMl, base.targets.waterMl)) || base.targets.waterMl,
		},
		startKg: positive(raw.startKg, base.startKg) || base.startKg,
		goalKg: positive(raw.goalKg, base.goalKg) || base.goalKg,
		startedOn: asDay(raw.startedOn) ?? base.startedOn,
		weighInDay: Math.min(6, Math.max(0, Math.round(asNumber(raw.weighInDay, base.weighInDay)))),
		weeklyBudget: Math.round(positive(raw.weeklyBudget, base.weeklyBudget)),
	};
}

function parsePlanned(raw: unknown): PlannedMeal | null {
	if (!isRecord(raw)) return null;
	const recipeId = asString(raw.recipeId, "");
	if (!recipeId) return null;
	return {
		slot: oneOf(raw.slot, SLOTS, "dinner"),
		recipeId,
		portions: Math.min(6, Math.max(0.5, asNumber(raw.portions, 1))),
	};
}

export function parsePlan(raw: unknown): WeekPlan | null {
	if (!isRecord(raw)) return null;
	const id = asDay(raw.id);
	if (!id) return null;
	return {
		id,
		days: asArray(raw.days, (item) => {
			if (!isRecord(item)) return null;
			const day = asDay(item.day);
			return day ? { day, meals: asArray(item.meals, parsePlanned) } : null;
		}),
		createdAt: asIso(raw.createdAt, new Date(0).toISOString()),
	};
}

function parseGroceryItem(raw: unknown): GroceryItem | null {
	if (!isRecord(raw)) return null;
	const id = asString(raw.id, "");
	const name = asString(raw.name, "").trim();
	if (!id || !name) return null;
	return {
		id,
		name,
		amount: asString(raw.amount, ""),
		section: oneOf(raw.section, GROCERY_SECTIONS, "extras"),
		price: Math.round(positive(raw.price)),
		bought: asBoolean(raw.bought, false),
		atHome: asBoolean(raw.atHome, false),
	};
}

export function parseGrocery(raw: unknown): GroceryList | null {
	if (!isRecord(raw)) return null;
	const id = asDay(raw.id);
	if (!id) return null;
	return {
		id,
		items: asArray(raw.items, parseGroceryItem),
		createdAt: asIso(raw.createdAt, new Date(0).toISOString()),
	};
}

export function parseRecipeState(raw: unknown): RecipeState | null {
	if (!isRecord(raw)) return null;
	const id = asString(raw.id, "");
	if (!id) return null;
	return {
		id,
		saved: asBoolean(raw.saved, false),
		atHome: asArray(raw.atHome, (value) =>
			typeof value === "number" && Number.isInteger(value) ? value : null,
		),
	};
}
