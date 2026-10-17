import type { HomeModule } from "@/modules/home/lib/module-home";
import { WishlistHomeView } from "./components/wishlist-home-view";
import { useWishlistHero } from "./hooks/use-wishlist-hero";
import { wishlistRoutes } from "./navigation";

export { useWishlistStatus } from "./hooks/use-wishlist-hero";

/** Wishlist Home: a yellow glow, what's left to save as the hero, "save for up next" on the right. */
export const wishlistHome: HomeModule = {
	glow: "statusCaution",
	action: { icon: "Filled/Play", label: "Save for up next" },
	useHero: useWishlistHero,
	View: WishlistHomeView,
	onInsights: wishlistRoutes.insights,
};
