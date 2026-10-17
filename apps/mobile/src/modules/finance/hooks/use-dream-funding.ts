import { useCallback, useMemo } from "react";
import { useNow } from "@/lib/use-now";
import { fundDream, unfundDream } from "../data/finance-actions";
import { lineRoom } from "../lib/finance-math";
import {
	CATEGORIES,
	CATEGORY_SHORT,
	CATEGORY_TONES,
	type Category,
	type Entry,
} from "../lib/finance-model";
import { useFinance } from "./use-finance";

export type FundingLine = {
	category: Category;
	label: string;
	tone: (typeof CATEGORY_TONES)[Category];
	/** Free on this line this month. */
	room: number;
};

/**
 * What Wishlist needs from Finance to put money aside: the budget lines with room left this
 * month, and the transfer itself (see `fundDream`).
 */
export function useDreamFunding() {
	const data = useFinance();
	const now = useNow();
	const { settings, entries, loading } = data;

	const lines = useMemo<FundingLine[]>(() => {
		const room = lineRoom(settings, entries, now);
		return CATEGORIES.filter((category) => category !== "dreams")
			.map((category) => ({
				category,
				label: CATEGORY_SHORT[category],
				tone: CATEGORY_TONES[category],
				room: room[category],
			}))
			.filter((line) => line.room > 0)
			.sort((a, b) => (a.category === "other" ? -1 : b.category === "other" ? 1 : b.room - a.room));
	}, [settings, entries, now]);

	const fund = useCallback(
		(amount: number, from: Category, dream: string): Promise<Entry> =>
			fundDream({ amount, from, dream }),
		[],
	);
	const unfund = useCallback(
		(entryId: string, amount: number, from: Category) => unfundDream({ entryId, amount, from }),
		[],
	);

	return {
		loading,
		/** False until Finance's runway numbers are set; then the budget lines mean something. */
		ready: settings.setUp,
		lines,
		/** Put aside for dreams this month so far. */
		dreamsLimit: settings.limits.dreams,
		/** Monthly pay now, or the expected salary while job hunting (0 when neither is set). */
		income: settings.monthlyIncome > 0 ? settings.monthlyIncome : settings.salary,
		/** True while the pay is only expected (no monthly income yet). */
		incomeExpected: settings.monthlyIncome <= 0 && settings.salary > 0,
		fund,
		unfund,
	};
}

export function isFinanceCategory(value: string): value is Category {
	return (CATEGORIES as readonly string[]).includes(value);
}
