import { addDays, dayKey } from "@/lib/day";
import {
	type FoodItem,
	type FoodSettings,
	type GroceryItem,
	type Macros,
	type Meal,
	type PlanDay,
	type PlannedMeal,
	SLOTS,
	type Slot,
	type WaterDay,
	type WeekPlan,
	type WeighIn,
	ZERO,
} from "./food-model";
import { foodById } from "./foods";
import { packLabel, productById } from "./groceries";
import { RECIPES, type Recipe, recipeById } from "./recipes";
import { remaining } from "./targets";

/** The numbers behind Food's screens. Pure, so they're tested without a phone. */

const round1 = (value: number) => Math.round(value * 10) / 10;

export function sumMacros(list: readonly Macros[]): Macros {
	const total = list.reduce(
		(sum, item) => ({
			kcal: sum.kcal + item.kcal,
			protein: sum.protein + item.protein,
			carbs: sum.carbs + item.carbs,
			fat: sum.fat + item.fat,
		}),
		ZERO,
	);
	return {
		kcal: Math.round(total.kcal),
		protein: round1(total.protein),
		carbs: round1(total.carbs),
		fat: round1(total.fat),
	};
}

export const mealTotals = (meal: Pick<Meal, "items">): Macros => sumMacros(meal.items);

/** What was eaten on `day` (planned meals don't count until they're logged). */
export function eatenOn(meals: readonly Meal[], day: string): Macros {
	return sumMacros(meals.filter((meal) => meal.day === day && !meal.planned).map(mealTotals));
}

/** "2 eggs, paratha, chai". */
export function itemsLine(items: readonly FoodItem[]): string {
	return items
		.map((item) => {
			const name = item.name.toLowerCase();
			if (item.quantity === 1 || item.unit) return name;
			return `${item.quantity} ${name.replace(/^fried |^boiled /, "").replace(/(egg)$/, "$1s")}`;
		})
		.join(", ");
}

export function recipeMacros(recipe: Recipe, portions: number): Macros {
	return {
		kcal: Math.round(recipe.kcal * portions),
		protein: round1(recipe.protein * portions),
		carbs: round1(recipe.carbs * portions),
		fat: round1(recipe.fat * portions),
	};
}

/** A recipe as one logged item. */
export function recipeItem(recipe: Recipe, portions: number): FoodItem {
	return {
		name: recipe.name,
		quantity: portions,
		unit: portions === 1 ? "serving" : "servings",
		foodId: null,
		...recipeMacros(recipe, portions),
	};
}

export type SlotRow = {
	slot: Slot;
	/** Minutes after midnight. */
	time: number;
	title: string;
	kcal: number;
	/** A photo the person took, else the recipe's id for a bundled photo. */
	photo: string | null;
	recipeId: string | null;
	/** Logged meals in this slot (more than one when they ate twice). */
	meals: Meal[];
	/** From the week's plan, waiting for Log. */
	planned: PlannedMeal | null;
};

const minutesOf = (iso: string) => {
	const date = new Date(iso);
	return date.getHours() * 60 + date.getMinutes();
};

/** Today's five slots: what was logged, or what the plan has waiting, or nothing yet. */
export function slotRows(
	meals: readonly Meal[],
	day: string,
	plan: PlanDay | null,
	times: Record<Slot, number>,
): SlotRow[] {
	return SLOTS.map((slot) => {
		const logged = meals
			.filter((meal) => meal.day === day && meal.slot === slot && !meal.planned)
			.sort((a, b) => a.at.localeCompare(b.at));
		const planned = plan?.meals.find((meal) => meal.slot === slot) ?? null;
		const first = logged[0];
		if (first) {
			return {
				slot,
				time: minutesOf(first.at),
				title: logged.map((meal) => itemsLine(meal.items)).join(" · "),
				kcal: sumMacros(logged.map(mealTotals)).kcal,
				photo: first.photo,
				recipeId: first.recipeId,
				meals: logged,
				planned: null,
			};
		}
		const recipe = planned ? recipeById(planned.recipeId) : undefined;
		return {
			slot,
			time: times[slot],
			title: recipe ? `Planned · ${recipe.name.toLowerCase()}` : "Nothing yet",
			kcal: recipe && planned ? recipeMacros(recipe, planned.portions).kcal : 0,
			photo: null,
			recipeId: recipe?.id ?? null,
			meals: [],
			planned: recipe ? planned : null,
		};
	});
}

// --- week and plan ------------------------------------------------------------------------------

/** The Monday of the week `date` is in. */
export function weekStart(date: Date): Date {
	const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
	return monday;
}

export function weekDays(date: Date): string[] {
	const monday = weekStart(date);
	return Array.from({ length: 7 }, (_, step) => dayKey(addDays(monday, step)));
}

export function planFor(plans: readonly WeekPlan[], day: string): PlanDay | null {
	for (const plan of plans) {
		const found = plan.days.find((item) => item.day === day);
		if (found) return found;
	}
	return null;
}

export function planDayMacros(day: PlanDay): Macros {
	return sumMacros(
		day.meals.flatMap((meal) => {
			const recipe = recipeById(meal.recipeId);
			return recipe ? [recipeMacros(recipe, meal.portions)] : [];
		}),
	);
}

export function planDayCost(day: PlanDay): number {
	return day.meals.reduce((sum, meal) => {
		const recipe = recipeById(meal.recipeId);
		return sum + (recipe ? recipe.cost * meal.portions : 0);
	}, 0);
}

const forSlot = (slot: Slot) => RECIPES.filter((recipe) => recipe.slots.includes(slot));

/**
 * A week of meals near the calorie and protein targets: each slot rotates through the recipes
 * that suit it (offset by `seed`, so Regenerate gives a different week), then lunch and dinner
 * portions grow or shrink in half steps to close the calorie gap.
 */
export function generatePlan(
	days: readonly string[],
	targets: Macros,
	seed = 0,
	keep: (day: string) => PlanDay | null = () => null,
): PlanDay[] {
	return days.map((day, index) => {
		const kept = keep(day);
		if (kept) return kept;
		const meals: PlannedMeal[] = SLOTS.map((slot, order) => {
			const options = forSlot(slot);
			const recipe = options[(index * 3 + seed * 5 + order) % options.length] ?? RECIPES[0];
			return { slot, recipeId: recipe?.id ?? "", portions: 1 };
		}).filter((meal) => meal.recipeId);
		const base = planDayMacros({ day, meals }).kcal;
		const flexible = meals.filter((meal) => meal.slot === "lunch" || meal.slot === "dinner");
		const flexKcal = flexible.reduce(
			(sum, meal) => sum + (recipeById(meal.recipeId)?.kcal ?? 0),
			0,
		);
		if (flexKcal > 0) {
			const scale = 1 + (targets.kcal - base) / flexKcal;
			const portions = Math.min(2, Math.max(1, Math.round(scale * 2) / 2));
			for (const meal of flexible) meal.portions = portions;
		}
		return { day, meals };
	});
}

// --- groceries ----------------------------------------------------------------------------------

/**
 * What the plan's days need from the shop, in whole packs. Ticks the person already made (bought,
 * at home) carry over from `previous` for products still on the list.
 */
export function groceriesFor(
	days: readonly PlanDay[],
	previous: readonly GroceryItem[] = [],
): GroceryItem[] {
	const need = new Map<string, number>();
	for (const day of days) {
		for (const meal of day.meals) {
			const recipe = recipeById(meal.recipeId);
			for (const use of recipe?.uses ?? []) {
				need.set(use.product, (need.get(use.product) ?? 0) + use.per * meal.portions);
			}
		}
	}
	const kept = new Map(previous.map((item) => [item.id, item]));
	return [...need.entries()].flatMap(([id, share]) => {
		const product = productById(id);
		if (!product) return [];
		const packs = Math.max(1, Math.ceil(share - 0.05));
		const before = kept.get(id);
		return [
			{
				id,
				name: product.name,
				amount: packLabel(product, packs),
				section: product.section,
				price: product.price * packs,
				bought: before?.bought ?? false,
				atHome: before?.atHome ?? false,
			},
		];
	});
}

/** The money still to spend: items not bought and not already at home. */
export function groceryTotal(items: readonly GroceryItem[]): number {
	return items.reduce((sum, item) => sum + (item.atHome ? 0 : item.price), 0);
}

// --- water and weight ---------------------------------------------------------------------------

export function waterOn(water: readonly WaterDay[], day: string): number {
	return water.find((item) => item.id === day)?.ml ?? 0;
}

export type WeightTrend = {
	latest: number;
	/** Change since the weigh-in about a week before the latest, or null with one weigh-in. */
	week: number | null;
	/** Gained (or lost, for a cut) toward the goal. */
	done: number;
	total: number;
	share: number;
};

export function weightTrend(weighIns: readonly WeighIn[], settings: FoodSettings): WeightTrend {
	const sorted = [...weighIns].sort((a, b) => a.id.localeCompare(b.id));
	const last = sorted.at(-1);
	const latest = last?.kg ?? settings.startKg;
	let week: number | null = null;
	if (last) {
		const cutoff = dayKey(addDays(new Date(`${last.id}T12:00:00`), -6));
		const older = sorted.filter((item) => item.id < last.id);
		const before = older.findLast((item) => item.id <= cutoff);
		const earlier = before ?? older[0];
		if (earlier) week = round1(latest - earlier.kg);
	}
	const total = Math.abs(settings.goalKg - settings.startKg);
	const direction = settings.goalKg >= settings.startKg ? 1 : -1;
	const done = Math.max(0, round1((latest - settings.startKg) * direction));
	return { latest, week, done, total, share: total > 0 ? Math.min(1, done / total) : 1 };
}

/** "week 3" of the goal. */
export function goalWeek(settings: FoodSettings, now: Date): number {
	const started = new Date(`${settings.startedOn}T00:00:00`).getTime();
	return Math.max(1, Math.floor((now.getTime() - started) / (7 * 86_400_000)) + 1);
}

// --- recipes and insights -----------------------------------------------------------------------

/** The recipe for `slot` that best fills the protein left without going far over calories. */
export function pickRecipe(slot: Slot, left: Macros): Recipe | null {
	const options = forSlot(slot);
	const scored = options
		.map((recipe) => {
			const over = Math.max(0, recipe.kcal - left.kcal - 150);
			return { recipe, score: Math.abs(left.protein - recipe.protein) + over / 10 };
		})
		.sort((a, b) => a.score - b.score);
	return scored[0]?.recipe ?? null;
}

/** The slot coming up at `minutes` past midnight. */
export function nextSlot(minutes: number, times: Record<Slot, number>): Slot {
	return SLOTS.find((slot) => times[slot] + 45 >= minutes) ?? "bed";
}

export type WeekRecap = {
	from: string;
	to: string;
	days: number;
	avgKcal: number;
	/** Average minus the target; negative when short. */
	gap: number;
	proteinDays: number;
	weightChange: number | null;
	avgBreakfastProtein: number | null;
};

export function weekRecap(
	meals: readonly Meal[],
	weighIns: readonly WeighIn[],
	settings: FoodSettings,
	days: readonly string[],
): WeekRecap {
	const logged = days.filter((day) => meals.some((meal) => meal.day === day && !meal.planned));
	const totals = logged.map((day) => eatenOn(meals, day));
	const avgKcal = totals.length
		? Math.round(totals.reduce((sum, item) => sum + item.kcal, 0) / totals.length)
		: 0;
	const breakfasts = meals.filter(
		(meal) => days.includes(meal.day) && meal.slot === "breakfast" && !meal.planned,
	);
	const inWeek = weighIns
		.filter((item) => days.includes(item.id))
		.sort((a, b) => a.id.localeCompare(b.id));
	const previous = weighIns
		.filter((item) => item.id < (days[0] ?? ""))
		.sort((a, b) => a.id.localeCompare(b.id))
		.at(-1);
	const first = previous ?? inWeek[0];
	const last = inWeek.at(-1);
	return {
		from: days[0] ?? "",
		to: days.at(-1) ?? "",
		days: logged.length,
		avgKcal,
		gap: avgKcal - settings.targets.kcal,
		proteinDays: totals.filter((item) => item.protein >= settings.targets.protein * 0.95).length,
		weightChange: first && last && first !== last ? round1(last.kg - first.kg) : null,
		avgBreakfastProtein: breakfasts.length
			? round1(
					breakfasts.reduce((sum, meal) => sum + mealTotals(meal).protein, 0) / breakfasts.length,
				)
			: null,
	};
}

/** Rupees per 10 g of protein, cheapest first, from the foods table. */
export function proteinPrices(
	ids: readonly string[] = ["daal", "milk", "boiled-egg", "chicken-tikka", "chana", "yogurt"],
) {
	return ids
		.flatMap((id) => {
			const food = foodById(id);
			return food && food.protein > 0
				? [{ id, name: food.name, per10g: Math.round((food.price / food.protein) * 10) }]
				: [];
		})
		.sort((a, b) => a.per10g - b.per10g);
}

export type FoodNote =
	| { kind: "dinner"; protein: number; recipe: Recipe; kcal: number }
	| { kind: "breakfast"; protein: number }
	| {
			kind: "protein-price";
			cheap: { name: string; per10g: number }[];
			dear: { name: string; per10g: number };
	  }
	| { kind: "water"; avgMl: number; targetMl: number };

/** What the Insights screen noticed, most useful first. */
export function foodNotes(input: {
	meals: readonly Meal[];
	water: readonly WaterDay[];
	settings: FoodSettings;
	today: string;
	days: readonly string[];
	recap: WeekRecap;
}): FoodNote[] {
	const notes: FoodNote[] = [];
	const left = remaining(input.settings.targets, eatenOn(input.meals, input.today));
	const dinnerLogged = input.meals.some(
		(meal) => meal.day === input.today && meal.slot === "dinner" && !meal.planned,
	);
	const recipe = dinnerLogged ? null : pickRecipe("dinner", left);
	if (recipe && left.protein >= 15) {
		notes.push({
			kind: "dinner",
			protein: Math.round(left.protein),
			recipe,
			kcal: recipe.kcal + 90,
		});
	}
	if (input.recap.avgBreakfastProtein !== null && input.recap.avgBreakfastProtein < 25) {
		notes.push({ kind: "breakfast", protein: Math.round(input.recap.avgBreakfastProtein) });
	}
	const prices = proteinPrices();
	const dear = prices.find((item) => item.id === "chicken-tikka");
	if (dear && prices.length >= 3) {
		notes.push({ kind: "protein-price", cheap: prices.slice(0, 2), dear });
	}
	const drank = input.days.map((day) => waterOn(input.water, day)).filter((ml) => ml > 0);
	if (drank.length >= 2) {
		const avgMl = Math.round(drank.reduce((sum, ml) => sum + ml, 0) / drank.length);
		if (avgMl < input.settings.targets.waterMl * 0.8) {
			notes.push({ kind: "water", avgMl, targetMl: input.settings.targets.waterMl });
		}
	}
	return notes;
}
