import { useEffect, useMemo } from "react";
import { useCollection } from "@/lib/db/collection";
import { dayKey } from "@/lib/day";
import { useNow } from "@/lib/use-now";
import {
	foodPlans,
	foodSettings,
	groceries,
	meals,
	recipeStates,
	water,
	weighIns,
} from "../data/collections";
import { migrateOldFood } from "../data/food-actions";
import { eatenOn, planFor, waterOn, weekDays, weightTrend } from "../lib/food-math";
import { defaultSettings } from "../lib/food-model";

let migration: Promise<unknown> | null = null;

/** Everything Food keeps on the phone, read through React Query from the record store. */
export function useFood() {
	const mealList = useCollection(meals);
	const waterList = useCollection(water);
	const weightList = useCollection(weighIns);
	const settingsList = useCollection(foodSettings);
	const planList = useCollection(foodPlans);
	const groceryList = useCollection(groceries);
	const recipeList = useCollection(recipeStates);

	useEffect(() => {
		migration ??= migrateOldFood().catch((error: unknown) =>
			console.error("[food] could not move the old food log", error),
		);
	}, []);

	return useMemo(() => {
		const queries = [
			mealList,
			waterList,
			weightList,
			settingsList,
			planList,
			groceryList,
			recipeList,
		];
		return {
			loading: queries.some((query) => query.isPending),
			meals: [...(mealList.data ?? [])].sort((a, b) => a.at.localeCompare(b.at)),
			water: waterList.data ?? [],
			weighIns: [...(weightList.data ?? [])].sort((a, b) => a.id.localeCompare(b.id)),
			settings: settingsList.data?.[0] ?? defaultSettings(),
			plans: [...(planList.data ?? [])].sort((a, b) => b.id.localeCompare(a.id)),
			groceries: groceryList.data ?? [],
			recipes: recipeList.data ?? [],
		};
	}, [mealList, waterList, weightList, settingsList, planList, groceryList, recipeList]);
}

export type FoodData = ReturnType<typeof useFood>;

/** Today's numbers: eaten, water, weight trend and the plan for this week. */
export function useFoodToday() {
	const data = useFood();
	const now = useNow();
	const today = dayKey(now);

	const view = useMemo(() => {
		const week = weekDays(now);
		const weekId = week[0] ?? today;
		return {
			week,
			weekId,
			plan: data.plans.find((plan) => plan.id === weekId) ?? null,
			planToday: planFor(data.plans, today),
			eaten: eatenOn(data.meals, today),
			waterMl: waterOn(data.water, today),
			trend: weightTrend(data.weighIns, data.settings),
		};
		// `today` changes when `now` crosses midnight.
	}, [data, today, now]);

	return { data, now, today, ...view };
}
