import type { Macros, MealSlot } from "./meals";
import type { Recipe } from "./recipes";

/** Lower is better: how badly a recipe misses what is left for the day. */
export function fitScore(recipe: Recipe, left: Macros, slot: MealSlot): number {
	const over = Math.max(0, recipe.kcal - left.kcal);
	const proteinShort = Math.max(0, left.protein - recipe.protein);
	const slotPenalty = recipe.slots.includes(slot) ? 0 : 1000;
	return slotPenalty + over / 25 + proteinShort / 4;
}

/** Recipes ordered by how well they fit the remaining calories and protein. */
export function rankRecipes(recipes: readonly Recipe[], left: Macros, slot: MealSlot): Recipe[] {
	const ranked = [...recipes];
	ranked.sort((a, b) => {
		const diff = fitScore(a, left, slot) - fitScore(b, left, slot);
		if (diff !== 0) return diff;
		const density = b.protein / b.kcal - a.protein / a.kcal;
		return density !== 0 ? density : a.id.localeCompare(b.id);
	});
	return ranked;
}

/** True when `portions` of the recipe fit in the calories left. */
export function fitsCalories(recipe: Recipe, left: Macros, portions = 1): boolean {
	return recipe.kcal * portions <= left.kcal;
}

/** Share (0–100) of the remaining protein that `portions` would cover. */
export function proteinCoverage(recipe: Recipe, left: Macros, portions = 1): number {
	if (left.protein <= 0) return 100;
	return Math.min(100, Math.round(((recipe.protein * portions) / left.protein) * 100));
}

export type RecipeFilter = "for-you" | "high-protein" | "under-500" | "desi" | "saved";

export const RECIPE_FILTERS: readonly { value: RecipeFilter; label: string }[] = [
	{ value: "for-you", label: "For you" },
	{ value: "high-protein", label: "High protein" },
	{ value: "under-500", label: "Under 500 kcal" },
	{ value: "desi", label: "Desi" },
	{ value: "saved", label: "Saved" },
];

/** At least 30% of the calories come from protein. */
export function isHighProtein(recipe: Recipe): boolean {
	return (recipe.protein * 4) / recipe.kcal >= 0.3;
}

export type RecipeQuery = {
	filter: RecipeFilter;
	search: string;
	left: Macros;
	slot: MealSlot;
	saved: readonly string[];
};

/** The Recipes list: search by name or ingredient, then the chosen filter and order. */
export function findRecipes(recipes: readonly Recipe[], query: RecipeQuery): Recipe[] {
	const needle = query.search.trim().toLowerCase();
	const matches = recipes.filter((recipe) => {
		if (needle) {
			const inName = recipe.name.toLowerCase().includes(needle);
			const inIngredients = recipe.ingredients.some((item) =>
				item.name.toLowerCase().includes(needle),
			);
			if (!inName && !inIngredients) return false;
		}
		switch (query.filter) {
			case "high-protein":
				return isHighProtein(recipe);
			case "under-500":
				return recipe.kcal < 500;
			case "desi":
				return recipe.cuisine === "Desi";
			case "saved":
				return query.saved.includes(recipe.id);
			default:
				return true;
		}
	});
	if (query.filter === "high-protein") {
		matches.sort((a, b) => b.protein - a.protein);
		return matches;
	}
	return rankRecipes(matches, query.left, query.slot);
}

/** Width shares (0–1) of protein, carbs and fat in a recipe's calories, for the split bar. */
export function macroSplit(recipe: Recipe): { protein: number; carbs: number; fat: number } {
	const p = recipe.protein * 4;
	const c = recipe.carbs * 4;
	const f = recipe.fat * 9;
	const total = p + c + f;
	if (total <= 0) return { protein: 0, carbs: 0, fat: 0 };
	return { protein: p / total, carbs: c / total, fat: f / total };
}
