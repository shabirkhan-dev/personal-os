import type { Macros, Slot } from "./food-model";

/**
 * Recipes are the person's own: written in the app, made with AI, or imported from a template
 * file. Macros and cost are per serving.
 */

export const RECIPE_TAGS = ["high-protein", "bulk", "desi", "quick", "cheap"] as const;
export type RecipeTag = (typeof RECIPE_TAGS)[number];

export type Ingredient = { name: string; amount: string };

/** What one serving takes from the grocery list: a product and the share of one pack. */
export type Use = { product: string; per: number };

export type Recipe = Macros & {
	id: string;
	name: string;
	/** The person's own photo of the dish: file:// on this phone until uploaded, then its R2 link. */
	image?: string | null;
	/** A video showing how it's made, on YouTube or anywhere else. */
	video?: string | null;
	/** Anything worth remembering: "less chilli for Ammi". */
	note?: string;
	/** Written by the person, so it can be edited and deleted. */
	mine?: boolean;
	/** "Desi · dinner". */
	kind: string;
	slots: Slot[];
	tags: RecipeTag[];
	minutes: number;
	serves: number;
	/** Rupees per serving. */
	cost: number;
	ingredients: Ingredient[];
	steps: { text: string; minutes?: number }[];
	uses: Use[];
};

/**
 * The person's recipes, kept here by `useFood` as their collection changes, so the plan, the
 * grocery list and every screen find them without passing them around.
 */
let mine: readonly Recipe[] = [];

export function setMyRecipes(list: readonly Recipe[]): void {
	mine = list;
}

/** The person's recipes: written, made with AI or imported. */
export function allRecipes(): readonly Recipe[] {
	return mine;
}

export function recipeById(id: string): Recipe | undefined {
	return mine.find((recipe) => recipe.id === id);
}

/** A YouTube search for the dish, for recipes without their own video. */
export function videoSearch(recipe: Pick<Recipe, "name">): string {
	return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${recipe.name} recipe`)}`;
}

export const TAG_LABELS: Record<RecipeTag, string> = {
	"high-protein": "High protein",
	bulk: "Bulk friendly",
	desi: "Desi",
	quick: "Quick",
	cheap: "Cheap",
};
