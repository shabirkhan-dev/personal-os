import { asArray, asNumber, asString, isRecord, oneOf } from "../parse";

/**
 * A logged training session (sets, rounds, a run's splits) and the calorie estimate, shared by the
 * app and the assistant.
 */

export const SPORTS = [
	"calisthenics",
	"running",
	"boxing",
	"yoga",
	"football",
	"volleyball",
	"gym",
	"swimming",
	"walk",
	"cycle",
	"other",
] as const;
export type Sport = (typeof SPORTS)[number];

export const SPORT_LABELS: Record<Sport, string> = {
	calisthenics: "Calisthenics",
	running: "Running",
	boxing: "Boxing",
	yoga: "Yoga",
	football: "Football",
	volleyball: "Volleyball",
	gym: "Gym",
	swimming: "Swimming",
	walk: "Walk",
	cycle: "Ride",
	other: "Workout",
};

export const FEELS = ["easy", "good", "hard"] as const;
export type Feel = (typeof FEELS)[number];

export type SetLog = {
	exercise: string;
	/** Reps, or seconds for a hold. */
	value: number;
	unit: "reps" | "s";
	/** The load for weighted lifts, in kilograms. */
	kg?: number;
};

export type Session = {
	id: string;
	/** The session template it followed, if any ("push-handstand"). */
	template: string | null;
	sport: Sport;
	title: string;
	startedAt: string;
	durationMin: number;
	distanceKm: number | null;
	kcal: number;
	feel: Feel | null;
	sets: SetLog[];
	rounds: number | null;
	/** Seconds per km, in order. */
	splits: number[];
	climbM: number | null;
	avgHr: number | null;
	note: string;
	/** The person's activity it was, for sessions logged against one. */
	activity?: string;
	/** That activity's own numbers ("goals": 2). */
	metrics?: Record<string, number>;
};

const asIso = (value: unknown) =>
	typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : null;
const positiveOrNull = (value: unknown) =>
	typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;

function parseSet(raw: unknown): SetLog | null {
	if (!isRecord(raw)) return null;
	const exercise = asString(raw.exercise, "").trim();
	const value = asNumber(raw.value, -1);
	if (!exercise || value < 0) return null;
	const kg = asNumber(raw.kg, 0);
	return {
		exercise: exercise.slice(0, 60),
		value: Math.min(10_000, Math.round(value)),
		unit: raw.unit === "s" ? "s" : "reps",
		...(kg > 0 ? { kg: Math.min(1000, Math.round(kg * 2) / 2) } : {}),
	};
}

export function parseSession(raw: unknown): Session | null {
	if (!isRecord(raw)) return null;
	const id = asString(raw.id, "");
	const startedAt = asIso(raw.startedAt);
	const durationMin = asNumber(raw.durationMin, -1);
	if (!id || !startedAt || durationMin < 0) return null;
	const sport = oneOf(raw.sport, SPORTS, "other");
	return {
		id,
		template: typeof raw.template === "string" && raw.template ? raw.template : null,
		sport,
		title: asString(raw.title, SPORT_LABELS[sport]).slice(0, 80) || SPORT_LABELS[sport],
		startedAt,
		durationMin: Math.min(24 * 60, Math.round(durationMin)),
		distanceKm: positiveOrNull(raw.distanceKm),
		kcal: Math.max(0, Math.round(asNumber(raw.kcal, 0))),
		feel: (FEELS as readonly unknown[]).includes(raw.feel) ? (raw.feel as Feel) : null,
		sets: asArray(raw.sets, parseSet),
		rounds: positiveOrNull(raw.rounds),
		splits: asArray(raw.splits, (item) =>
			typeof item === "number" && item > 60 && item < 3600 ? Math.round(item) : null,
		),
		climbM:
			typeof raw.climbM === "number" && Number.isFinite(raw.climbM) ? Math.round(raw.climbM) : null,
		avgHr: positiveOrNull(raw.avgHr),
		note: asString(raw.note, "").slice(0, 500),
		...(typeof raw.activity === "string" && raw.activity
			? { activity: raw.activity.slice(0, 60) }
			: {}),
		...parseMetrics(raw.metrics),
	};
}

function parseMetrics(raw: unknown): { metrics?: Record<string, number> } {
	if (!isRecord(raw)) return {};
	const metrics: Record<string, number> = {};
	for (const [key, value] of Object.entries(raw).slice(0, 8)) {
		if (typeof value === "number" && Number.isFinite(value) && key.length <= 30) {
			metrics[key] = Math.round(value * 100) / 100;
		}
	}
	return Object.keys(metrics).length > 0 ? { metrics } : {};
}

/** Compendium-style MET values for a typical effort. */
const MET: Record<Sport, number> = {
	calisthenics: 5,
	running: 9.8,
	boxing: 7.8,
	yoga: 2.5,
	football: 7,
	volleyball: 4,
	gym: 5,
	swimming: 7,
	walk: 3.5,
	cycle: 7.5,
	other: 4.5,
};

/** Running MET from pace: roughly 1 MET per km/h, kept within a sane range. */
function runMet(distanceKm: number, durationMin: number): number {
	const kmh = distanceKm / (durationMin / 60);
	return Math.min(16, Math.max(6, kmh));
}

/** kcal = MET × weight (kg) × hours, rounded. */
export function estimateKcal(
	type: Sport,
	durationMin: number,
	weightKg: number,
	distanceKm?: number,
): number {
	if (durationMin <= 0 || weightKg <= 0) return 0;
	const met =
		type === "running" && distanceKm && distanceKm > 0
			? runMet(distanceKm, durationMin)
			: MET[type];
	return Math.round(met * weightKg * (durationMin / 60));
}
