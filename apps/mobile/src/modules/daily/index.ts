import type { HomeModule } from "@/modules/home/lib/module-home";
import { DailyHomeView } from "./components/daily-home-view";
import { useDailyHero } from "./hooks/use-daily-hero";
import { dailyRoutes } from "./navigation";

export { DailyOverview } from "./components/daily-overview";
export { useDailyStatus } from "./hooks/use-daily-hero";
export { dailyRoutes } from "./navigation";

/** Daily life Home, the hub that ties the modules together: the minimum day as the hero. */
export const dailyHome: HomeModule = {
	glow: "textPrimary",
	action: { icon: "Sun", label: "Morning brief" },
	useHero: useDailyHero,
	View: DailyHomeView,
	onInsights: dailyRoutes.insights,
};
