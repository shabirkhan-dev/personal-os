import { router } from "expo-router";

/** Food's own screens, pushed over Today. */
export const foodRoutes = {
	log: () => router.push("/food/log"),
	plan: () => router.push("/food/plan"),
	grocery: () => router.push("/food/grocery"),
	recipes: () => router.push("/food/recipes"),
	recipe: (id: string) => router.push({ pathname: "/food/recipe/[id]", params: { id } }),
	insights: () => router.push("/food/insights"),
	scan: () => router.push("/food/scan"),
	goal: () => router.push("/food/goal"),
	today: () => router.dismissTo("/"),
} as const;
