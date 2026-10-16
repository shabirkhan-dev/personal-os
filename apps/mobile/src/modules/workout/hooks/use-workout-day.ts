import { useMemo } from "react";
import type { DayEntry } from "@/modules/home/lib/module-day";
import { sessionsOnDay } from "../lib/training-math";
import { useTrainingToday } from "./use-training";

export type WorkoutDay = {
	minutesToday: number;
	plannedToday: boolean;
	entries: DayEntry[];
	/** When past sessions started (hour of day), for "best time to train". */
	startHours: number[];
};

/** Today's training for Daily life. */
export function useWorkoutDay(): WorkoutDay {
	const { data, today, template } = useTrainingToday();
	return useMemo(() => {
		const done = sessionsOnDay(data.sessions, today);
		const minutesToday = done.reduce((sum, session) => sum + session.durationMin, 0);
		const plannedToday = template !== undefined && template.id !== "mobility";
		const entries: DayEntry[] =
			template || done.length > 0
				? [
						{
							id: "workout-today",
							minutes: data.settings.trainAt,
							length: template?.minutes ?? done[0]?.durationMin ?? 45,
							title: template?.title ?? done[0]?.title ?? "Training",
							detail: `${template?.minutes ?? done[0]?.durationMin ?? 45} min`,
							done: minutesToday > 0,
						},
					]
				: [];
		return {
			minutesToday,
			plannedToday,
			entries,
			startHours: data.sessions.map((session) => new Date(session.startedAt).getHours()),
		};
	}, [data, today, template]);
}
