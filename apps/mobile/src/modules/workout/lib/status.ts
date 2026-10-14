import { formatClock } from "@/modules/onboarding/lib/time";
import { sessionsOn } from "./kcal";
import { weekStart } from "./score";
import type { WorkoutSession } from "./types";

/** The day plan puts the workout at 18:30 for 45 minutes (onboarding `buildDayPlan`). */
export const PLANNED_START_MIN = 18 * 60 + 30;
export const PLANNED_LENGTH_MIN = 45;

/** One line for the module picker. `plannedDays` is Monday first. */
export function workoutStatus(
	sessions: readonly WorkoutSession[],
	plannedDays: readonly boolean[],
	now: Date,
): string {
	const today = sessionsOn(sessions, now);
	if (today.length > 0) {
		const minutes = today.reduce((sum, session) => sum + session.durationMin, 0);
		return `Done today · ${minutes} min`;
	}
	const minuteOfDay = now.getHours() * 60 + now.getMinutes();
	const plannedToday = plannedDays[(now.getDay() + 6) % 7] === true;
	if (plannedToday && minuteOfDay < PLANNED_START_MIN + PLANNED_LENGTH_MIN) {
		return `Workout at ${formatClock(PLANNED_START_MIN)}`;
	}
	if (sessions.length === 0) return "Log your first workout";
	const start = weekStart(now).getTime();
	const week = sessions.filter((session) => new Date(session.startedAt).getTime() >= start);
	if (week.length === 0) return "No workouts yet this week";
	return `${week.length} workout${week.length === 1 ? "" : "s"} this week`;
}
