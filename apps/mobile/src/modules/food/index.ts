import { useEffect } from "react";
import { dayKey } from "@/lib/day";
import type { HomeHero, HomeModule } from "@/modules/home/lib/module-home";
import { FoodView } from "./components/food-view";
import { useFoodDay, useNow } from "./hooks/use-food-day";
import { foodStatus, formatKcal } from "./lib/meals";
import { useFoodStore } from "./store/food-store";

/** "Food · eaten today" / "1,240" / " / 1,950 kcal". */
function useFoodHero(): HomeHero {
	const { eaten, targets } = useFoodDay();
	return {
		label: "Food · eaten today",
		value: formatKcal(eaten.kcal),
		faint: ` / ${formatKcal(targets.kcal)} kcal`,
	};
}

/** The module picker line: "2 meals logged" or "Log breakfast". */
export function useFoodStatus(): string {
	const now = useNow();
	const meals = useFoodStore((state) => state.data.meals);
	const hydrate = useFoodStore((state) => state.hydrate);
	useEffect(() => {
		hydrate().catch((error: unknown) => console.error("Could not load food log", error));
	}, [hydrate]);
	return foodStatus(meals, dayKey(now), now);
}

export const foodHome: HomeModule = {
	glow: "statusCaution",
	action: { icon: "Filled/Camera", label: "Photo of a meal" },
	useHero: useFoodHero,
	View: FoodView,
};
