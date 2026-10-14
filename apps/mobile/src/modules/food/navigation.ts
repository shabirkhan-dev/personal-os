import { router } from "expo-router";

/** Food's own routes: the recipe list and one recipe. */
export function openRecipes(): void {
	router.push("/recipes");
}

export function openRecipe(id: string): void {
	router.push({ pathname: "/recipe/[id]", params: { id } });
}
