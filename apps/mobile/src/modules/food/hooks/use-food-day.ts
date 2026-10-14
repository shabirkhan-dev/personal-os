import { useEffect, useMemo, useState } from "react";
import { dayKey } from "@/lib/day";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { usePlan } from "@/modules/onboarding/store/use-plan";
import { type Macros, slotSummaries, type SlotSummary, totalsFor } from "../lib/meals";
import { type FoodTargets, foodTargets, remaining } from "../lib/targets";
import { useFoodStore } from "../store/food-store";

/** The current local time, refreshed each minute so the day rolls over at midnight. */
export function useNow(): Date {
	const [now, setNow] = useState(() => new Date());
	useEffect(() => {
		const timer = setInterval(() => setNow(new Date()), 60_000);
		return () => clearInterval(timer);
	}, []);
	return now;
}

export type FoodDay = {
	now: Date;
	today: string;
	hydrated: boolean;
	targets: FoodTargets;
	eaten: Macros;
	left: Macros;
	slots: SlotSummary[];
	waterMl: number;
};

/** Today's meals, water, targets and what is left, from the saved food document. */
export function useFoodDay(): FoodDay {
	const now = useNow();
	const { calories } = usePlan();
	const weightKg = useOnboardingStore((state) => state.weightKg);
	const { data, hydrated, hydrate } = useFoodStore();

	useEffect(() => {
		hydrate().catch((error: unknown) => console.error("Could not load food log", error));
	}, [hydrate]);

	const today = dayKey(now);
	return useMemo(() => {
		const targets = foodTargets(calories, weightKg);
		const eaten = totalsFor(data.meals, today);
		return {
			now,
			today,
			hydrated,
			targets,
			eaten,
			left: remaining(targets, eaten),
			slots: slotSummaries(data.meals, today),
			waterMl: data.water[today] ?? 0,
		};
	}, [calories, weightKg, data, hydrated, now, today]);
}
