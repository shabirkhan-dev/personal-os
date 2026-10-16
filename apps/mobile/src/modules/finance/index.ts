import type { HomeModule } from "@/modules/home/lib/module-home";
import { FinanceHomeView } from "./components/finance-home-view";
import { useFinanceHero } from "./hooks/use-finance-hero";
import { financeRoutes } from "./navigation";

export { type FinanceSummary, useFinanceStatus, useFinanceSummary } from "./hooks/use-finance-hero";

/** Finance Home: a green glow, money now and the runway as the hero, Scan receipt on the right. */
export const financeHome: HomeModule = {
	glow: "statusSuccess",
	action: { icon: "Filled/Scan", label: "Scan receipt" },
	useHero: useFinanceHero,
	View: FinanceHomeView,
	onInsights: financeRoutes.insights,
};
