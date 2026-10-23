import type { Exercise } from "./library";

type Pausable = { pausedAtMs: number | null; pausedMs: number; restUntilMs: number | null };

/**
 * Pauses or resumes a live session. Resuming adds the pause to the paused total and pushes a
 * running rest timer back by the same amount, so a break never eats into rest.
 */
export function togglePause<T extends Pausable>(live: T, nowMs: number): T {
	if (live.pausedAtMs === null) return { ...live, pausedAtMs: nowMs };
	const pause = Math.max(0, nowMs - live.pausedAtMs);
	return {
		...live,
		pausedAtMs: null,
		pausedMs: live.pausedMs + pause,
		restUntilMs: live.restUntilMs === null ? null : live.restUntilMs + pause,
	};
}

/** Seconds a timed block runs for: the hold being aimed at, or the block's minutes. */
export function timedSeconds(exercise: Exercise, value: number): number | null {
	if (exercise.unit === "s") return Math.max(1, value);
	if (exercise.unit === "min") return Math.max(1, exercise.target ?? 1) * 60;
	return null;
}

/** Whole seconds left on a countdown started at `startedAtMs`; 0 once it has run out. */
export function secondsLeft(startedAtMs: number, totalS: number, nowMs: number): number {
	return Math.max(0, Math.ceil(totalS - (nowMs - startedAtMs) / 1000));
}

/** Timed blocks (a 5 min warm-up, a run) are done, not counted, so they log no set. */
export function logsSets(exercise: Exercise): boolean {
	return exercise.unit !== "min";
}
