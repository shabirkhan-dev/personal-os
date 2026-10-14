/** Meals and water the person logs, and the day totals the Food home shows. */

export const MEAL_SLOTS = ["breakfast", "lunch", "snack", "dinner"] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];

export type Meal = {
	id: string;
	/** "YYYY-MM-DD" local day the meal belongs to. */
	dayKey: string;
	slot: MealSlot;
	name: string;
	kcal: number;
	protein?: number;
	carbs?: number;
	fat?: number;
	/** ISO time it was eaten (or logged). */
	at: string;
	/** Photo copied into the app's document directory. */
	photoUri?: string;
	/** Planned but not eaten yet: shown in its slot, never counted in totals. */
	planned?: boolean;
	/** Bundled recipe it came from, when it did. */
	recipeId?: string;
};

export type Macros = { kcal: number; protein: number; carbs: number; fat: number };

const SLOT_LABELS: Record<MealSlot, string> = {
	breakfast: "Breakfast",
	lunch: "Lunch",
	snack: "Snack",
	dinner: "Dinner",
};

export function slotLabel(slot: MealSlot): string {
	return SLOT_LABELS[slot];
}

/** The meal a person is most likely logging at this time of day. */
export function slotForTime(date: Date): MealSlot {
	const hour = date.getHours();
	if (hour >= 4 && hour < 11) return "breakfast";
	if (hour >= 11 && hour < 16) return "lunch";
	if (hour >= 16 && hour < 19) return "snack";
	return "dinner";
}

/** Meals actually eaten on a day (planned ones are left out). */
export function eatenOn(meals: readonly Meal[], day: string): Meal[] {
	return meals.filter((meal) => meal.dayKey === day && !meal.planned);
}

export function totalsFor(meals: readonly Meal[], day: string): Macros {
	const totals: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
	for (const meal of eatenOn(meals, day)) {
		totals.kcal += meal.kcal;
		totals.protein += meal.protein ?? 0;
		totals.carbs += meal.carbs ?? 0;
		totals.fat += meal.fat ?? 0;
	}
	return totals;
}

export type SlotSummary = {
	slot: MealSlot;
	/** Eaten meals in this slot, oldest first. */
	eaten: Meal[];
	/** A planned meal waiting to be logged. */
	planned: Meal | null;
	kcal: number;
};

export function slotSummaries(meals: readonly Meal[], day: string): SlotSummary[] {
	return MEAL_SLOTS.map((slot) => {
		const inSlot = meals.filter((meal) => meal.dayKey === day && meal.slot === slot);
		const eaten = inSlot.filter((meal) => !meal.planned);
		eaten.sort((a, b) => a.at.localeCompare(b.at));
		return {
			slot,
			eaten,
			planned: inSlot.find((meal) => meal.planned) ?? null,
			kcal: eaten.reduce((sum, meal) => sum + meal.kcal, 0),
		};
	});
}

/** How many of the four slots have something eaten. */
export function loggedSlotCount(meals: readonly Meal[], day: string): number {
	return slotSummaries(meals, day).filter((summary) => summary.eaten.length > 0).length;
}

/** The picker line: "2 meals logged", or "Log lunch" before anything is logged. */
export function foodStatus(meals: readonly Meal[], day: string, now: Date): string {
	const count = eatenOn(meals, day).length;
	if (count === 0) return `Log ${slotLabel(slotForTime(now)).toLowerCase()}`;
	return `${count} ${count === 1 ? "meal" : "meals"} logged`;
}

export function formatKcal(value: number): string {
	return Math.round(value).toLocaleString("en-US");
}

/** Water: one glass is 250 ml. */
export const GLASS_ML = 250;

/** "1.5" litres, one decimal, no trailing ".0" beyond one place. */
export function litres(ml: number): string {
	return (Math.round(ml / 100) / 10).toFixed(1);
}

/** Glasses to draw and how many are full. */
export function waterGlasses(ml: number, goalMl: number): { total: number; filled: number } {
	const total = Math.max(1, Math.ceil(goalMl / GLASS_ML));
	return { total, filled: Math.min(total, Math.floor(ml / GLASS_ML)) };
}
