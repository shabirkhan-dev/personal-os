import { useEffect, useMemo } from "react";
import type { DayEntry } from "@/modules/home/lib/module-day";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { sessionsOn } from "../lib/kcal";
import { PLANNED_LENGTH_MIN, PLANNED_START_MIN } from "../lib/status";
import { useWorkoutStore } from "../store/workout-store";
import { useNow } from "./use-now";

export type WorkoutDay = {
	minutesToday: number;
	plannedToday: boolean;
	entries: DayEntry[];
	/** When past sessions started (hour of day), for "best time to train". */
	startHours: number[];
};

/** Today's training for Daily life. */
export function useWorkoutDay(): WorkoutDay {
	const sessions = useWorkoutStore((state) => state.data.sessions);
	const hydrate = useWorkoutStore((state) => state.hydrate);
	const workdays = useOnboardingStore((state) => state.workdays);
	const now = useNow();
	useEffect(() => {
		hydrate();
	}, [hydrate]);
	return useMemo(() => {
		const today = sessionsOn(sessions, now);
		const minutesToday = today.reduce((sum, session) => sum + session.durationMin, 0);
		const plannedToday = workdays[(now.getDay() + 6) % 7] === true;
		const title = today[0]?.title ?? "Workout";
		return {
			minutesToday,
			plannedToday,
			entries:
				plannedToday || today.length > 0
					? [
							{
								id: "workout-today",
								minutes: PLANNED_START_MIN,
								length: PLANNED_LENGTH_MIN,
								title,
								detail: `${PLANNED_LENGTH_MIN} min`,
								done: minutesToday > 0,
							},
						]
					: [],
			startHours: sessions.map((session) => new Date(session.startedAt).getHours()),
		};
	}, [sessions, workdays, now]);
}
