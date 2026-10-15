import { router } from "expo-router";

/** Fashion's own screens, pushed over Today. */
export const fashionRoutes = {
	wardrobe: () => router.push("/fashion/wardrobe"),
	piece: (id: string) => router.push({ pathname: "/fashion/piece/[id]", params: { id } }),
	add: (options: { edit?: string; category?: string } = {}) =>
		router.push({ pathname: "/fashion/add", params: options }),
	plan: () => router.push("/fashion/plan"),
	wishlist: () => router.push("/fashion/wishlist"),
	watches: () => router.push("/fashion/watches"),
	insights: () => router.push("/fashion/insights"),
	today: () => router.dismissTo("/"),
} as const;
