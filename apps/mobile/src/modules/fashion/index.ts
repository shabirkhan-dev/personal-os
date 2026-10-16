import type { HomeModule } from "@/modules/home/lib/module-home";
import { FashionHomeView } from "./components/fashion-home-view";
import { useFashionHero } from "./hooks/use-fashion-hero";
import { fashionRoutes } from "./navigation";

export { useFashionStatus } from "./hooks/use-fashion-hero";
export { type FashionDay, useFashionDay } from "./hooks/use-fashion-day";
export { PieceImage } from "./components/piece-image";

/** Fashion Home: a soft white glow, the weather as the hero, Add piece on the right. */
export const fashionHome: HomeModule = {
	glow: "textTertiary",
	action: { icon: "Filled/Scan", label: "Add a piece" },
	useHero: useFashionHero,
	View: FashionHomeView,
	onInsights: fashionRoutes.insights,
};
