import { addDays, dayKey } from "@/lib/day";
import type { WorkoutSession } from "./types";

/** Minutes of training a day that counts as a full bar. */
export const DAILY_TARGET_MIN = 30;

const LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

export type WeekBar = {
	key: string;
	letter: string;
	minutes: number;
	/** 0..1 of the daily target. */
	ratio: number;
	isToday: boolean;
	isFuture: boolean;
};

/** Sunday at 00:00 of the week containing `now`. */
export function weekStart(now: Date): Date {
	const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	return addDays(start, -start.getDay());
}

/** Logged minutes per day, keyed by `dayKey`. */
export function minutesByDay(sessions: readonly WorkoutSession[]): Map<string, number> {
	const out = new Map<string, number>();
	for (const session of sessions) {
		const key = dayKey(new Date(session.startedAt));
		out.set(key, (out.get(key) ?? 0) + session.durationMin);
	}
	return out;
}

/** This week's bars, Sunday first, from logged minutes vs the daily target. */
export function weekBars(
	sessions: readonly WorkoutSession[],
	now: Date,
	target: number = DAILY_TARGET_MIN,
): WeekBar[] {
	const minutes = minutesByDay(sessions);
	const start = weekStart(now);
	const today = dayKey(now);
	return LETTERS.map((letter, index) => {
		const date = addDays(start, index);
		const key = dayKey(date);
		const value = minutes.get(key) ?? 0;
		return {
			key,
			letter,
			minutes: value,
			ratio: target > 0 ? Math.min(1, value / target) : 0,
			isToday: key === today,
			isFuture: key > today,
		};
	});
}

/** Score % = minutes toward the target each day (capped per day) over the whole week. */
export function trainingScore(bars: readonly WeekBar[]): number {
	if (bars.length === 0) return 0;
	const total = bars.reduce((sum, bar) => sum + bar.ratio, 0);
	return Math.round((total / bars.length) * 100);
}
