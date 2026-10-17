import { router } from "expo-router";

/** Wishlist's own screens, pushed over Today. */
export const wishlistRoutes = {
	/** `save` opens Add savings straight away (the Home header's button). */
	dream: (id: string, save = false) =>
		router.push({ pathname: "/wishlist/dream/[id]", params: { id, save: save ? "1" : "" } }),
	/** With `editId`, the same screen edits that dream. */
	add: (editId?: string) =>
		router.push({ pathname: "/wishlist/add", params: editId ? { edit: editId } : {} }),
	roadmap: () => router.push("/wishlist/roadmap"),
	garage: () => router.push("/wishlist/garage"),
	compare: (a?: string, b?: string) =>
		router.push({ pathname: "/wishlist/compare", params: { a: a ?? "", b: b ?? "" } }),
	insights: () => router.push("/wishlist/insights"),
	today: () => router.dismissTo("/"),
} as const;
