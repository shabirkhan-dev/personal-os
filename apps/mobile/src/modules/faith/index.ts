import type { HomeModule } from "@/modules/home/lib/module-home";
import { FaithHomeView } from "./components/faith-home-view";
import { SkyBackdrop } from "./components/sky-backdrop";
import { useFaithHero } from "./hooks/use-faith-hero";
import { faithRoutes } from "./navigation";

export { useFaithStatus } from "./hooks/use-faith-hero";
export { useFaithPlace } from "./hooks/use-faith";
export { type FaithDay, useFaithDay } from "./hooks/use-faith-day";

/** Faith Home: the Sky header that follows the time of day, prayers as the hero, Qibla on the right. */
export const faithHome: HomeModule = {
	glow: "statusSuccess",
	action: { icon: "Filled/Scan", label: "Qibla" },
	useHero: useFaithHero,
	View: FaithHomeView,
	Backdrop: SkyBackdrop,
	onInsights: faithRoutes.insights,
};
