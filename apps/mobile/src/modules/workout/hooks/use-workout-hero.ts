import { useEffect } from "react";
import type { HomeHero } from "@/modules/home/lib/module-home";
import { formatThousands, kcalOn } from "../lib/kcal";
import { useWorkoutStore } from "../store/workout-store";
import { useNow } from "./use-now";

/** "Workout · burned today / 486 kcal" from today's logged sessions. */
export function useWorkoutHero(): HomeHero {
	const sessions = useWorkoutStore((state) => state.data.sessions);
	const hydrate = useWorkoutStore((state) => state.hydrate);
	const now = useNow();
	useEffect(() => {
		hydrate();
	}, [hydrate]);
	return {
		label: "Workout · burned today",
		value: formatThousands(kcalOn(sessions, now)),
		faint: " kcal",
	};
}
