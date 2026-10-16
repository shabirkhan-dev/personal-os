import { useMemo } from "react";
import type { DayEntry } from "@/modules/home/lib/module-day";
import { slotRows } from "../lib/food-math";
import { SLOT_LABELS, SLOT_TIMES } from "../lib/food-model";
import { useFoodToday } from "./use-food";

export type FoodDay = {
	setUp: boolean;
	kcal: number;
	kcalTarget: number;
	protein: number;
	proteinTarget: number;
	/** The five meal slots, planned or eaten. */
	entries: DayEntry[];
	/** Breakfast, for the morning brief's "Ready for you". */
	breakfast: { title: string; kcal: number; protein: number; recipeId: string | null } | null;
	weight: { kg: number; week: number | null } | null;
};

/** Today's food numbers for Daily life. */
export function useFoodDay(): FoodDay {
	const { data, eaten, today, planToday, trend } = useFoodToday();
	return useMemo(() => {
		const rows = slotRows(data.meals, today, planToday, SLOT_TIMES);
		const breakfast = rows.find((row) => row.slot === "breakfast");
		return {
			setUp: data.settings.setUp,
			kcal: eaten.kcal,
			kcalTarget: data.settings.targets.kcal,
			protein: eaten.protein,
			proteinTarget: data.settings.targets.protein,
			entries: rows
				.filter((row) => row.meals.length > 0 || row.planned)
				.map((row) => ({
					id: `food-${row.slot}`,
					minutes: row.time,
					length: 20,
					title: row.planned
						? `${SLOT_LABELS[row.slot]} · ${row.title.replace(/^Planned · /, "")}`
						: SLOT_LABELS[row.slot],
					detail: `${Math.round(row.kcal)} kcal`,
					done: row.meals.length > 0,
				})),
			breakfast:
				breakfast && (breakfast.meals.length > 0 || breakfast.planned)
					? {
							title: breakfast.title.replace(/^Planned · /, ""),
							kcal: breakfast.kcal,
							protein: Math.round(
								breakfast.meals.reduce(
									(sum, meal) => sum + meal.items.reduce((total, item) => total + item.protein, 0),
									0,
								),
							),
							recipeId: breakfast.recipeId,
						}
					: null,
			weight: data.weighIns.length > 0 ? { kg: trend.latest, week: trend.week } : null,
		};
	}, [data, eaten, today, planToday, trend]);
}
