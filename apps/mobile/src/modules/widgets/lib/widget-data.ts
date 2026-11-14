import { listItems } from "@/lib/db/collection";
import { dayKey } from "@/lib/day";
import { faithSettings, tasbihDays } from "@/modules/faith/data/collections";
import { TASBIH_PHRASES, tasbihProgress, timesSource } from "@/modules/faith/lib/faith-math";
import { dayTimes, PRAYER_LABELS, slots } from "@/modules/faith/lib/prayer-times";
import { financeEntries, financeSettings } from "@/modules/finance/data/collections";
import {
	budgetTotal,
	inMonth,
	monthLimits,
	spends,
	total,
} from "@/modules/finance/lib/finance-math";
import { defaultSettings as defaultFinanceSettings } from "@/modules/finance/lib/finance-model";
import { foodSettings, water } from "@/modules/food/data/collections";
import { waterOn } from "@/modules/food/lib/food-math";
import { defaultSettings as defaultFoodSettings } from "@/modules/food/lib/food-model";

/**
 * What the home-screen widgets show, read straight from the record store so it works in the
 * background (the widget task runs without any screen open).
 */
export type WidgetSnapshot = {
	water: { ml: number; targetMl: number };
	tasbih: {
		phraseId: string;
		label: string;
		arabic: string;
		count: number;
		target: number;
		setsDone: number;
		sets: number;
	};
	/** Null until Finance has a budget. */
	money: { left: number; budget: number; spent: number } | null;
	/** Null until Faith is set up. */
	prayer: { label: string; at: Date } | null;
};

export async function loadWidgetSnapshot(now = new Date()): Promise<WidgetSnapshot> {
	const [waterDays, food, faith, tasbih, finance, entries] = await Promise.all([
		listItems(water),
		listItems(foodSettings),
		listItems(faithSettings),
		listItems(tasbihDays),
		listItems(financeSettings),
		listItems(financeEntries),
	]);
	const today = dayKey(now);

	const faithSet = faith[0];
	const sequence = faithSet?.tasbih ?? [];
	const counts = tasbih.find((day) => day.id === today) ?? { id: today, counts: {} };
	const progress = tasbihProgress(sequence, counts);
	const phrase = sequence[progress.index] ?? TASBIH_PHRASES[0];

	const financeSet = finance[0] ?? defaultFinanceSettings();
	const month = inMonth(entries, now);
	const budget = budgetTotal(monthLimits(financeSet, month, now));
	const spent = total(spends(month));

	return {
		water: {
			ml: waterOn(waterDays, today),
			targetMl: (food[0] ?? defaultFoodSettings()).targets.waterMl,
		},
		tasbih: {
			phraseId: phrase?.id ?? "subhanallah",
			label: phrase?.label ?? "SubhanAllah",
			arabic: phrase?.arabic ?? "",
			count: phrase ? (counts.counts[phrase.id] ?? 0) : 0,
			target: phrase?.target ?? 33,
			setsDone: progress.setsDone,
			sets: sequence.length,
		},
		money:
			financeSet.setUp && budget > 0
				? { left: Math.round(budget - spent), budget: Math.round(budget), spent: Math.round(spent) }
				: null,
		prayer: faithSet?.setUp ? nextPrayer(faithSet, now) : null,
	};
}

function nextPrayer(
	settings: NonNullable<Parameters<typeof timesSource>[0]>,
	now: Date,
): { label: string; at: Date } | null {
	for (const offset of [0, 1]) {
		const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
		const next = slots(dayTimes(timesSource(settings), day), settings.prayers).find(
			(slot) => slot.at > now,
		);
		if (next) return { label: PRAYER_LABELS[next.prayer], at: next.at };
	}
	return null;
}
