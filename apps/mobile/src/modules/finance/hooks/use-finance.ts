import { useEffect, useMemo } from "react";
import { useCollection } from "@/lib/db/collection";
import { useNow } from "@/lib/use-now";
import { financeBills, financeEntries, financeSettings, financeSources } from "../data/collections";
import { migrateOldFinance } from "../data/finance-actions";
import {
	balanceNow,
	budgetTotal,
	byCategory,
	inMonth,
	monthlyBurn,
	monthlyCost,
	onDay,
	pace,
	runwayDays,
	spends,
	total,
} from "../lib/finance-math";
import { defaultSettings } from "../lib/finance-model";

let migration: Promise<unknown> | null = null;

/** Everything Finance keeps on the phone, read through React Query from the record store. */
export function useFinance() {
	const settingsList = useCollection(financeSettings);
	const entryList = useCollection(financeEntries);
	const billList = useCollection(financeBills);
	const sourceList = useCollection(financeSources);

	useEffect(() => {
		migration ??= migrateOldFinance().catch((error: unknown) =>
			console.error("[finance] could not move the old finance file", error),
		);
	}, []);

	return useMemo(() => {
		const queries = [settingsList, entryList, billList, sourceList];
		return {
			loading: queries.some((query) => query.isPending),
			settings: settingsList.data?.[0] ?? defaultSettings(),
			entries: [...(entryList.data ?? [])].sort((a, b) => b.at.localeCompare(a.at)),
			bills: [...(billList.data ?? [])].sort((a, b) => a.dueDay - b.dueDay),
			sources: [...(sourceList.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
		};
	}, [settingsList, entryList, billList, sourceList]);
}

export type FinanceData = ReturnType<typeof useFinance>;

/** Money now, the runway and this month's spending against the budget. */
export function useFinanceToday() {
	const data = useFinance();
	const now = useNow();
	const view = useMemo(() => {
		const { settings, entries } = data;
		const month = inMonth(entries, now);
		const spent = total(spends(month));
		const budget = budgetTotal(settings.limits);
		const balance = balanceNow(settings, entries);
		const burn = monthlyBurn(settings);
		return {
			balance,
			burn,
			cost: monthlyCost(settings),
			days: runwayDays(balance, burn),
			month,
			spent,
			spentToday: total(spends(onDay(entries, now))),
			budget,
			sums: byCategory(month),
			pace: pace(spent, budget, now),
		};
	}, [data, now]);
	return { data, now, ...view };
}
