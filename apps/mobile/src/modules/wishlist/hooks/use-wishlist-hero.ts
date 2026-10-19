import type { HomeHero } from "@/modules/home/lib/module-home";
import { compactMoney, progressPercent } from "../lib/wishlist-math";
import { wishlistRoutes } from "../navigation";
import { useWishlistToday } from "./use-wishlist";

/** "Wishlist · 8 dreams, cash only / Rs 12.7M to save". */
export function useWishlistHero(): HomeHero {
	const { data, line, toSave } = useWishlistToday();
	if (data.loading) return { label: "Wishlist", value: "…" };
	if (line.length === 0) {
		return { label: "Wishlist · nothing yet", value: "0", faint: " dreams" };
	}
	return {
		label: `Wishlist · ${line.length} ${line.length === 1 ? "dream" : "dreams"}, cash only`,
		value: compactMoney(toSave),
		faint: " to save",
		hideable: true,
		onLabelPress: wishlistRoutes.roadmap,
	};
}

/** The Overview / picker line for Wishlist. */
export function useWishlistStatus(): string {
	const { data, next } = useWishlistToday();
	if (data.loading) return "Loading…";
	if (!next) return "What would you love to own?";
	return `${next.name} · ${progressPercent(next)}% saved`;
}
