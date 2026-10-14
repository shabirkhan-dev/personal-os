import { dayKey } from "@/lib/day";
import { doneCount, isRoutineDone, routineFor, routineStreak } from "./routine";
import { emptyDay, type SkincareDoc } from "./skincare-types";

const pad = (n: number) => String(n).padStart(2, "0");

/** Night routine time: 30 minutes before bedtime. */
export function nightRoutineTime(bedMinutes: number): string {
	const minutes = (((bedMinutes - 30) % 1440) + 1440) % 1440;
	return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

/** One line for the module picker: "2 of 4 done", "PM routine at 22:30", "12 day streak". */
export function skincareStatus(doc: SkincareDoc, now: Date, bedMinutes: number): string {
	const kind = routineFor(now);
	const day = doc.completions[dayKey(now)] ?? emptyDay();
	const steps = doc.routines[kind];
	const done = doneCount(steps, day[kind]);
	if (done > 0 && done < steps.length) return `${done} of ${steps.length} done`;
	const nightPending =
		doc.routines.night.length > 0 && !isRoutineDone(doc.routines.night, day.night);
	const morningSettled = kind === "night" || isRoutineDone(doc.routines.morning, day.morning);
	if (morningSettled && nightPending) return `PM routine at ${nightRoutineTime(bedMinutes)}`;
	const streak = routineStreak(doc, now);
	if (streak > 0) return `${streak} day streak`;
	if (kind === "morning" && steps.length > 0) return `AM routine · ${steps.length} steps`;
	return "Set up your routine";
}
