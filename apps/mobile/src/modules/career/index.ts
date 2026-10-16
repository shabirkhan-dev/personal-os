import type { HomeModule } from "@/modules/home/lib/module-home";
import { CareerHomeView } from "./components/career-home-view";
import { useCareerHero } from "./hooks/use-career-hero";

export { useCareerStatus } from "./hooks/use-career-hero";
export { type CareerDay, useCareerDay } from "./hooks/use-career-day";

/** Career Home: blue glow, the applications list in the header, runway as the hero. */
export const careerHome: HomeModule = {
	glow: "accentDefault",
	action: { icon: "List", label: "Applications" },
	useHero: useCareerHero,
	View: CareerHomeView,
};
