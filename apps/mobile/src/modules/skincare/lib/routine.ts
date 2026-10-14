import { addDays, dayKey } from "@/lib/day";
import {
	type DayRecord,
	emptyDay,
	ROUTINE_KINDS,
	type RoutineKind,
	type SkincareDoc,
	type Step,
	type StepsDone,
} from "./skincare-types";

/** Morning until 15:00, night after. */
export function routineFor(now: Date): RoutineKind {
	return now.getHours() < 15 ? "morning" : "night";
}

export function isRoutineDone(steps: readonly Step[], done: StepsDone): boolean {
	return steps.length > 0 && steps.every((step) => Boolean(done[step.id]));
}

export function doneCount(steps: readonly Step[], done: StepsDone): number {
	return steps.filter((step) => Boolean(done[step.id])).length;
}

/** The first step not ticked yet (the NEXT tag), or null. */
export function nextStepId(steps: readonly Step[], done: StepsDone): string | null {
	return steps.find((step) => !done[step.id])?.id ?? null;
}

/** Re-freezes `finished` for one routine from its current steps. */
function withFinished(day: DayRecord, kind: RoutineKind, steps: readonly Step[]): DayRecord {
	const others = day.finished.filter((k) => k !== kind);
	return { ...day, finished: isRoutineDone(steps, day[kind]) ? [...others, kind] : others };
}

/** Ticks or unticks a step on `date`, recording the time it was done. */
export function toggleStep(
	doc: SkincareDoc,
	kind: RoutineKind,
	stepId: string,
	date: Date,
): SkincareDoc {
	const key = dayKey(date);
	const day = doc.completions[key] ?? emptyDay();
	const done = { ...day[kind] };
	if (done[stepId]) delete done[stepId];
	else done[stepId] = date.toISOString();
	const next = withFinished({ ...day, [kind]: done }, kind, doc.routines[kind]);
	return { ...doc, completions: { ...doc.completions, [key]: next } };
}

/** Marks every step of a routine done on `date` (keeps times already recorded). */
export function completeRoutine(doc: SkincareDoc, kind: RoutineKind, date: Date): SkincareDoc {
	const key = dayKey(date);
	const day = doc.completions[key] ?? emptyDay();
	const done = { ...day[kind] };
	for (const step of doc.routines[kind]) done[step.id] ??= date.toISOString();
	const next = withFinished({ ...day, [kind]: done }, kind, doc.routines[kind]);
	return { ...doc, completions: { ...doc.completions, [key]: next } };
}

/** Saves an edited routine and re-checks whether today's run of it is still complete. */
export function setRoutine(
	doc: SkincareDoc,
	kind: RoutineKind,
	steps: Step[],
	today: Date,
): SkincareDoc {
	const routines = { ...doc.routines, [kind]: steps };
	const key = dayKey(today);
	const day = doc.completions[key];
	if (!day) return { ...doc, routines };
	return {
		...doc,
		routines,
		completions: { ...doc.completions, [key]: withFinished(day, kind, steps) },
	};
}

/**
 * Routines that count for the streak: ones with steps that the person has finished at least once.
 * Someone who only ever does the morning routine is not punished for an unused night routine.
 */
export function routinesInUse(doc: SkincareDoc): RoutineKind[] {
	const finishedEver = new Set<RoutineKind>();
	for (const day of Object.values(doc.completions)) {
		for (const kind of day.finished) finishedEver.add(kind);
	}
	return ROUTINE_KINDS.filter((kind) => doc.routines[kind].length > 0 && finishedEver.has(kind));
}

/**
 * Consecutive days where every routine in use was fully done, ending today, or yesterday when
 * today is not finished yet.
 */
export function routineStreak(doc: SkincareDoc, today: Date): number {
	const kinds = routinesInUse(doc);
	if (kinds.length === 0) return 0;
	const complete = (date: Date) => {
		const day = doc.completions[dayKey(date)];
		return day ? kinds.every((kind) => day.finished.includes(kind)) : false;
	};
	let cursor = complete(today) ? today : addDays(today, -1);
	let streak = 0;
	while (complete(cursor)) {
		streak += 1;
		cursor = addDays(cursor, -1);
	}
	return streak;
}
