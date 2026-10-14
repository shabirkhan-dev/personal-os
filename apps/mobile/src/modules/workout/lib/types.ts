import { asArray, asNumber, asString, isRecord, oneOf } from "@/lib/storage/parse";

export const workoutTypes = ["strength", "run", "walk", "cycle", "yoga", "other"] as const;
export type WorkoutType = (typeof workoutTypes)[number];

export const feels = ["easy", "good", "hard"] as const;
export type Feel = (typeof feels)[number];

export type WorkoutSession = {
	id: string;
	type: WorkoutType;
	title: string;
	/** ISO timestamp. */
	startedAt: string;
	durationMin: number;
	distanceKm?: number;
	/** Estimated from MET × weight × hours unless the person edited it. */
	kcal: number;
	feel: Feel | null;
};

export type EnergyCheckin = { id: string; at: string; level: number };

/** A workout started with the live timer; kept in the document so it survives closing the app. */
export type ActiveSession = {
	type: WorkoutType;
	title: string;
	/** Epoch ms when the timer started. */
	startedAtMs: number;
	/** Total paused time so far. */
	pausedMs: number;
	/** Epoch ms when paused, or null while running. */
	pausedAtMs: number | null;
};

export type WorkoutDoc = {
	sessions: WorkoutSession[];
	energy: EnergyCheckin[];
	active: ActiveSession | null;
};

export const emptyWorkoutDoc: WorkoutDoc = { sessions: [], energy: [], active: null };

export const typeLabel: Record<WorkoutType, string> = {
	strength: "Strength",
	run: "Run",
	walk: "Walk",
	cycle: "Ride",
	yoga: "Yoga",
	other: "Workout",
};

function validDate(value: string): boolean {
	return value.length > 0 && !Number.isNaN(new Date(value).getTime());
}

function parseSession(raw: unknown): WorkoutSession | null {
	if (!isRecord(raw)) return null;
	const id = asString(raw.id, "");
	const startedAt = asString(raw.startedAt, "");
	const durationMin = asNumber(raw.durationMin, -1);
	if (!id || !validDate(startedAt) || durationMin < 0) return null;
	const type = oneOf(raw.type, workoutTypes, "other");
	const distance = asNumber(raw.distanceKm, -1);
	return {
		id,
		type,
		title: asString(raw.title, typeLabel[type]),
		startedAt,
		durationMin,
		...(distance > 0 ? { distanceKm: distance } : {}),
		kcal: Math.max(0, asNumber(raw.kcal, 0)),
		feel: (feels as readonly unknown[]).includes(raw.feel) ? (raw.feel as Feel) : null,
	};
}

function parseCheckin(raw: unknown): EnergyCheckin | null {
	if (!isRecord(raw)) return null;
	const id = asString(raw.id, "");
	const at = asString(raw.at, "");
	const level = asNumber(raw.level, -1);
	if (!id || !validDate(at) || level < 0 || level > 100) return null;
	return { id, at, level };
}

function parseActive(raw: unknown): ActiveSession | null {
	if (!isRecord(raw)) return null;
	const startedAtMs = asNumber(raw.startedAtMs, -1);
	if (startedAtMs <= 0) return null;
	const type = oneOf(raw.type, workoutTypes, "other");
	const pausedAtMs = asNumber(raw.pausedAtMs, -1);
	return {
		type,
		title: asString(raw.title, typeLabel[type]),
		startedAtMs,
		pausedMs: Math.max(0, asNumber(raw.pausedMs, 0)),
		pausedAtMs: pausedAtMs > 0 ? pausedAtMs : null,
	};
}

/** Reads the stored "workout" document; damaged entries are dropped. */
export function parseWorkoutDoc(raw: unknown): WorkoutDoc {
	if (!isRecord(raw)) return emptyWorkoutDoc;
	return {
		sessions: asArray(raw.sessions, parseSession),
		energy: asArray(raw.energy, parseCheckin),
		active: parseActive(raw.active),
	};
}

/** Milliseconds on the live timer at `nowMs`, not counting pauses. */
export function activeElapsedMs(active: ActiveSession, nowMs: number): number {
	const end = active.pausedAtMs ?? nowMs;
	return Math.max(0, end - active.startedAtMs - active.pausedMs);
}
