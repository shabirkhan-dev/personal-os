import { router } from "expo-router";

/** Food's own screens, pushed over Today. */
export const foodRoutes = {
	log: () => router.push("/food/log"),
	plan: () => router.push("/food/plan"),
	grocery: () => router.push("/food/grocery"),
	recipes: () => router.push("/food/recipes"),
	recipe: (id: string) => router.push({ pathname: "/food/recipe/[id]", params: { id } }),
	/** After saving a recipe: its page in place of the editor. */
	recipeReplace: (id: string) => router.replace({ pathname: "/food/recipe/[id]", params: { id } }),
	/** Write a recipe; `id` edits one of the person's, `copy` starts from a bundled one. */
	recipeEdit: (options: { id?: string; copy?: string } = {}) =>
		router.push({ pathname: "/food/recipe-edit", params: options }),
	insights: () => router.push("/food/insights"),
	scan: () => router.push("/food/scan"),
	goal: () => router.push("/food/goal"),
	today: () => router.dismissTo("/"),
} as const;
