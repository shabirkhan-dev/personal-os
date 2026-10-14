import { newId } from "@/lib/day";
import { createDocumentStore } from "@/lib/storage/document-store";
import { clampLevel } from "../lib/energy";
import {
	activeElapsedMs,
	emptyWorkoutDoc,
	parseWorkoutDoc,
	type WorkoutDoc,
	type WorkoutSession,
	type WorkoutType,
} from "../lib/types";

/** Workout sessions, energy check-ins and the running timer, saved as "workout". */
export const useWorkoutStore = createDocumentStore<WorkoutDoc>(
	"workout",
	emptyWorkoutDoc,
	parseWorkoutDoc,
);

const update = (recipe: (doc: WorkoutDoc) => WorkoutDoc) =>
	useWorkoutStore.getState().update(recipe);

export function addSession(session: Omit<WorkoutSession, "id">): void {
	update((doc) => ({ ...doc, sessions: [...doc.sessions, { ...session, id: newId() }] }));
}

export function removeSession(id: string): void {
	update((doc) => ({ ...doc, sessions: doc.sessions.filter((session) => session.id !== id) }));
}

export function addEnergy(level: number, at: Date = new Date()): void {
	update((doc) => ({
		...doc,
		energy: [...doc.energy, { id: newId(), at: at.toISOString(), level: clampLevel(level) }],
	}));
}

export function startTimer(type: WorkoutType, title: string): void {
	update((doc) => ({
		...doc,
		active: { type, title, startedAtMs: Date.now(), pausedMs: 0, pausedAtMs: null },
	}));
}

export function togglePause(): void {
	update((doc) => {
		const active = doc.active;
		if (!active) return doc;
		const now = Date.now();
		return {
			...doc,
			active:
				active.pausedAtMs === null
					? { ...active, pausedAtMs: now }
					: { ...active, pausedMs: active.pausedMs + (now - active.pausedAtMs), pausedAtMs: null },
		};
	});
}

/** Stops the clock and returns the minutes on it (at least 1); the caller saves the session. */
export function stopTimer(): number {
	const active = useWorkoutStore.getState().data.active;
	if (!active) return 0;
	const minutes = Math.max(1, Math.round(activeElapsedMs(active, Date.now()) / 60000));
	update((doc) => ({
		...doc,
		active: doc.active ? { ...doc.active, pausedAtMs: doc.active.pausedAtMs ?? Date.now() } : null,
	}));
	return minutes;
}

export function clearTimer(): void {
	update((doc) => ({ ...doc, active: null }));
}
