import type { HomeHero } from "@/modules/home/lib/module-home";
import { goalWeek } from "../lib/food-math";
import { GOAL_LABELS } from "../lib/food-model";
import { foodRoutes } from "../navigation";
import { useFoodToday } from "./use-food";

const kcal = (value: number) => Math.round(value).toLocaleString("en-US");

/** "Food · lean bulk, week 3 / 1,620 / 2,900 kcal". */
export function useFoodHero(): HomeHero {
	const { data, eaten, now } = useFoodToday();
	const { settings } = data;
	if (!settings.setUp) {
		return { label: "Food · first day", value: kcal(eaten.kcal), faint: " kcal so far" };
	}
	return {
		label: `Food · ${GOAL_LABELS[settings.goal].toLowerCase()}, week ${goalWeek(settings, now)}`,
		value: kcal(eaten.kcal),
		faint: ` / ${kcal(settings.targets.kcal)} kcal`,
		onLabelPress: foodRoutes.goal,
	};
}

/** The Overview line for Food. */
export function useFoodStatus(): string {
	const { data, eaten } = useFoodToday();
	if (!data.settings.setUp && eaten.kcal === 0) return "Set your goal";
	const left = Math.max(0, data.settings.targets.kcal - eaten.kcal);
	if (eaten.kcal === 0) return `${kcal(data.settings.targets.kcal)} kcal to go today`;
	return left > 0
		? `${kcal(left)} kcal left · ${Math.round(eaten.protein)} g protein`
		: "Target reached today";
}
