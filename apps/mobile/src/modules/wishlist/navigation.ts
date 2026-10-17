import { router } from "expo-router";

/** Wishlist's own screens, pushed over Today. */
export const wishlistRoutes = {
	dream: (id: string) => router.push({ pathname: "/wishlist/dream/[id]", params: { id } }),
	add: () => router.push("/wishlist/add"),
	roadmap: () => router.push("/wishlist/roadmap"),
	garage: () => router.push("/wishlist/garage"),
	compare: (a?: string, b?: string) =>
		router.push({ pathname: "/wishlist/compare", params: { a: a ?? "", b: b ?? "" } }),
	insights: () => router.push("/wishlist/insights"),
	today: () => router.dismissTo("/"),
} as const;
