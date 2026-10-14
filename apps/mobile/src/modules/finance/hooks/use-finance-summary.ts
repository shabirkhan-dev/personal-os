import { useEffect, useMemo } from "react";
import { formatMoney, moneyParts } from "@/lib/money";
import type { HomeHero } from "@/modules/home/lib/module-home";
import { leftToSpend, spentThisMonth } from "../lib/finance-math";
import { useFinanceStore } from "../store/finance-store";
import { useNow } from "./use-now";

export type FinanceSummary = {
	hydrated: boolean;
	budget: number | null;
	spentThisMonth: number;
	/** Budget minus spent this month (negative when over); null with no budget. */
	leftToSpend: number | null;
};

/** This month's money at a glance; the Overview money card and the Finance Home read it. */
export function useFinanceSummary(): FinanceSummary {
	const hydrated = useFinanceStore((state) => state.hydrated);
	const hydrate = useFinanceStore((state) => state.hydrate);
	const expenses = useFinanceStore((state) => state.data.expenses);
	const budget = useFinanceStore((state) => state.data.budget);
	const now = useNow(60_000);

	useEffect(() => {
		hydrate().catch((error: unknown) => console.error("Could not load finance", error));
	}, [hydrate]);

	return useMemo(() => {
		const spent = spentThisMonth(expenses, now);
		return { hydrated, budget, spentThisMonth: spent, leftToSpend: leftToSpend(budget, spent) };
	}, [hydrated, budget, expenses, now]);
}

/** Short line for the module picker: "Rs 42,300 left this month", "Set a budget". */
export function useFinanceStatus(): string {
	const summary = useFinanceSummary();
	if (!summary.hydrated) return "Loading…";
	if (summary.leftToSpend !== null) {
		return summary.leftToSpend >= 0
			? `${formatMoney(summary.leftToSpend)} left this month`
			: `${formatMoney(-summary.leftToSpend)} over budget`;
	}
	if (summary.spentThisMonth > 0) return `${formatMoney(summary.spentThisMonth)} spent this month`;
	return "Set a budget";
}

/** The number under the Finance header. */
export function useFinanceHero(): HomeHero {
	const summary = useFinanceSummary();
	if (summary.leftToSpend !== null) {
		const over = summary.leftToSpend < 0;
		const { whole, decimal } = moneyParts(Math.abs(summary.leftToSpend));
		return {
			label: over ? "Finance · over budget this month" : "Finance · saved this month",
			value: whole,
			faint: decimal,
			hideable: true,
		};
	}
	const { whole, decimal } = moneyParts(summary.spentThisMonth);
	return { label: "Finance · spent this month", value: whole, faint: decimal, hideable: true };
}
