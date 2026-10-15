import { create } from "zustand";

/**
 * The recitation timer lives outside the screen, so it keeps running when the person goes back to
 * Home or another module, and Home can show how much is left.
 */
type Timer = {
	/** When the current run started (ms), or null when paused or stopped. */
	runningSince: number | null;
	/** Time already counted before the current run. */
	elapsedMs: number;
	targetMinutes: number;
	active: boolean;
	start: (targetMinutes: number) => void;
	pause: () => void;
	resume: () => void;
	/** Stops and returns the minutes recited. */
	finish: () => number;
};

export const useRecitationTimer = create<Timer>((set, get) => ({
	runningSince: null,
	elapsedMs: 0,
	targetMinutes: 10,
	active: false,
	start: (targetMinutes) =>
		set({ active: true, runningSince: Date.now(), elapsedMs: 0, targetMinutes }),
	pause: () => {
		const { runningSince, elapsedMs } = get();
		if (runningSince === null) return;
		set({ runningSince: null, elapsedMs: elapsedMs + Date.now() - runningSince });
	},
	resume: () => {
		if (get().active && get().runningSince === null) set({ runningSince: Date.now() });
	},
	finish: () => {
		const minutes = elapsedMinutes(get(), Date.now());
		set({ active: false, runningSince: null, elapsedMs: 0 });
		return minutes;
	},
}));

export function elapsedMinutes(
	timer: Pick<Timer, "runningSince" | "elapsedMs">,
	now: number,
): number {
	const ms = timer.elapsedMs + (timer.runningSince === null ? 0 : now - timer.runningSince);
	return Math.round((ms / 60_000) * 10) / 10;
}
