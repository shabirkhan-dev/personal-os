import type { HomeModule } from "@/modules/home/lib/module-home";
import { FinanceHomeView } from "./components/finance-home-view";
import { useFinanceHero } from "./hooks/use-finance-summary";

export { useFinanceStatus, useFinanceSummary } from "./hooks/use-finance-summary";
export type { FinanceSummary } from "./hooks/use-finance-summary";

/** Finance Home: yellow glow, "Scan receipt" in the header, saved this month as the hero. */
export const financeHome: HomeModule = {
	glow: "statusCaution",
	action: { icon: "Filled/Scan", label: "Scan receipt" },
	useHero: useFinanceHero,
	View: FinanceHomeView,
};
