import type { HomeModule } from "@/modules/home/lib/module-home";
import { CareHomeView } from "./components/care-home-view";
import { useCareHero } from "./hooks/use-care-hero";
import { careRoutes } from "./navigation";

export { useCareStatus } from "./hooks/use-care-hero";
export { type CareDay, useCareDay } from "./hooks/use-care-day";

/** Care Home (skin, hair, body): the streak as the hero, the weekly check-in on the right. */
export const careHome: HomeModule = {
	glow: "statusViolet",
	action: { icon: "Filled/Calendar", label: "Weekly check-in" },
	useHero: useCareHero,
	View: CareHomeView,
	onInsights: careRoutes.insights,
};
