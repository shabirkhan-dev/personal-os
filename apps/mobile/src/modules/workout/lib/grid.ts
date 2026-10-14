import { dayKey } from "@/lib/day";
import { minutesByDay } from "./score";
import type { WorkoutSession } from "./types";

/** A day counts as Partial when its logged minutes stay under this. */
export const PARTIAL_UNDER_MIN = 15;

export type DayState = "done" | "partial" | "missed" | "rest" | "upcoming";

export type GridCell = { key: string; day: number; state: DayState };

/**
 * One cell per day of `month`. Done = trained that day, Partial = under 15 minutes, Missed = a
 * planned day (from the onboarding workdays, Monday first) that passed with nothing logged.
 * Today and later are "upcoming" until they have a session.
 */
export function monthCells(
	sessions: readonly WorkoutSession[],
	month: Date,
	plannedDays: readonly boolean[],
	now: Date,
): GridCell[] {
	const minutes = minutesByDay(sessions);
	const year = month.getFullYear();
	const index = month.getMonth();
	const count = new Date(year, index + 1, 0).getDate();
	const today = dayKey(now);
	const cells: GridCell[] = [];
	for (let day = 1; day <= count; day += 1) {
		const date = new Date(year, index, day);
		const key = dayKey(date);
		const logged = minutes.get(key) ?? 0;
		const planned = plannedDays[(date.getDay() + 6) % 7] === true;
		let state: DayState;
		if (logged >= PARTIAL_UNDER_MIN) state = "done";
		else if (logged > 0) state = "partial";
		else if (key >= today) state = "upcoming";
		else state = planned ? "missed" : "rest";
		cells.push({ key, day, state });
	}
	return cells;
}

/** Splits the month into `rows` even rows (the widget shows three). */
export function gridRows<T>(cells: readonly T[], rows = 3): T[][] {
	const size = Math.ceil(cells.length / rows);
	const out: T[][] = [];
	for (let start = 0; start < cells.length; start += size)
		out.push(cells.slice(start, start + size));
	return out;
}

export function countStates(cells: readonly GridCell[]): Record<DayState, number> {
	const out: Record<DayState, number> = { done: 0, partial: 0, missed: 0, rest: 0, upcoming: 0 };
	for (const cell of cells) out[cell.state] += 1;
	return out;
}
