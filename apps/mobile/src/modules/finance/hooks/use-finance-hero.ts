import { formatMoney } from "@/lib/money";
import type { HomeHero } from "@/modules/home/lib/module-home";
import { financeRoutes } from "../navigation";
import { useFinanceToday } from "./use-finance";

export type FinanceSummary = {
	hydrated: boolean;
	/** The month's budget; null until runway mode is set up. */
	budget: number | null;
	spentThisMonth: number;
	spentToday: number;
	/** Budget minus spent this month (negative when over); null with no budget. */
	leftToSpend: number | null;
};

/** This month's money at a glance, for the Overview money card, Career and Daily life. */
export function useFinanceSummary(): FinanceSummary {
	const { data, spent, spentToday, budget } = useFinanceToday();
	const set = data.settings.setUp && budget > 0;
	return {
		hydrated: !data.loading,
		budget: set ? budget : null,
		spentThisMonth: spent,
		spentToday,
		leftToSpend: set ? Math.round((budget - spent) * 100) / 100 : null,
	};
}

/** "Finance · runway mode / Rs 148,500 · 81 days". */
export function useFinanceHero(): HomeHero {
	const { data, balance, days } = useFinanceToday();
	if (!data.settings.setUp) {
		return { label: "Finance · getting started", value: "How long", faint: " can you last?" };
	}
	return {
		label: data.settings.protect ? "Finance · minimum only" : "Finance · runway mode",
		value: formatMoney(Math.round(balance)),
		faint: days === null ? " · covered" : ` · ${days} ${days === 1 ? "day" : "days"}`,
		hideable: true,
		onLabelPress: financeRoutes.runway,
	};
}

/** The Overview line for Finance. */
export function useFinanceStatus(): string {
	const { data, days, budget, spent } = useFinanceToday();
	if (data.loading) return "Loading…";
	if (!data.settings.setUp) return "How long can you last?";
	if (days !== null)
		return `${days} days of runway · ${formatMoney(Math.round(budget - spent))} left`;
	return `${formatMoney(Math.round(budget - spent))} left this month`;
}
