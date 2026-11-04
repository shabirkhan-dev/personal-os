import type { HomeModule } from "@/modules/home/lib/module-home";
import { HealthHomeView } from "./components/health-home-view";
import { useHealthHero } from "./hooks/use-health-hero";
import { healthRoutes } from "./navigation";

export { useHealthStatus } from "./hooks/use-health-hero";

/** Health Home: a red glow, readiness or the last blood pressure as the hero, Add reading on the right. */
export const healthHome: HomeModule = {
	glow: "statusDanger",
	action: { icon: "Line/Plus", label: "Add a reading" },
	useHero: useHealthHero,
	View: HealthHomeView,
	onInsights: healthRoutes.insights,
};
