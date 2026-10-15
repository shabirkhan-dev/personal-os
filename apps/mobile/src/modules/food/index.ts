import type { HomeModule } from "@/modules/home/lib/module-home";
import { FoodHomeView } from "./components/food-home-view";
import { useFoodHero } from "./hooks/use-food-hero";
import { foodRoutes } from "./navigation";

export { useFoodStatus } from "./hooks/use-food-hero";

/** Food Home: a warm yellow glow, today's calories as the hero, the camera on the right. */
export const foodHome: HomeModule = {
	glow: "statusCaution",
	action: { icon: "Filled/Camera", label: "Snap a meal" },
	useHero: useFoodHero,
	View: FoodHomeView,
	onInsights: foodRoutes.insights,
};
