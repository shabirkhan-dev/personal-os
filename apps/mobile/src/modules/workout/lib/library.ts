import { asArray, asNumber, asString, isRecord } from "@/lib/storage/parse";
import { SPORTS, type Sport } from "./training-model";

/**
 * What a session looks like once it's planned: the person's program sessions and activities are
 * turned into these, plus the boxing timer's own session. No workouts ship with the app.
 */

export type Exercise = {
	name: string;
	photo: string;
	sets: number;
	/** Reps per set, or seconds for a hold; null for "max". */
	target: number | null;
	unit: "reps" | "s" | "min";
	/** "each" side. */
	each?: boolean;
	restS: number;
	note: string;
	/** Program sessions: which level this counts towards and the range that moves it on. */
	progress?: ExerciseProgress;
	/** Gym lifts log kilograms; the load to start from, when known. */
	weighted?: boolean;
	kg?: number | null;
};

export type ExerciseProgress = {
	/** A chain id or an exercise id. */
	key: string;
	step: number;
	range: readonly [number, number];
	chainLength: number;
};

export type Template = {
	id: string;
	title: string;
	sport: Sport;
	photo: string;
	/** A wider photo for the plan's header. */
	hero: string;
	minutes: number;
	effort: number;
	exercises: Exercise[];
	/** Running: the distance; boxing: rounds of `roundMin`. */
	distanceKm?: number;
	rounds?: number;
	roundMin?: number;
	restMin?: number;
	/** Shown under the title on the week program: "48 min", "5 km", "6 rounds". */
	short: string;
	/** Set when the session comes from a program. */
	program?: { id: string; title: string; week: number; kind: "build" | "deload" | "test" };
};

/**
 * The boxing round timer's session (Training → Boxing → Start shadow boxing): six three-minute
 * rounds with call-outs. It's the timer's own setup, not a workout template.
 */
export const SHADOW_BOXING: Template = {
	id: "shadow-boxing",
	title: "Shadow boxing",
	sport: "boxing",
	photo: "",
	hero: "",
	minutes: 24,
	effort: 7,
	rounds: 6,
	roundMin: 3,
	restMin: 1,
	short: "6 rounds",
	exercises: [
		{
			name: "Shadow boxing",
			photo: "",
			sets: 6,
			target: 3,
			unit: "min",
			restS: 60,
			note: "1 min rest between rounds",
		},
	],
};

/** Program sessions are made on the fly from the program and the person's levels. */
let resolveGenerated: ((id: string) => Template | undefined) | null = null;

/** Lets the data layer resolve generated ids ("p:hybrid-athlete:3:push") once it has loaded. */
export function setTemplateResolver(resolver: ((id: string) => Template | undefined) | null): void {
	resolveGenerated = resolver;
}

export function templateById(id: string | null | undefined): Template | undefined {
	if (!id) return undefined;
	return id === SHADOW_BOXING.id ? SHADOW_BOXING : resolveGenerated?.(id);
}

/** "4 × 30 s", "3 × max", "3 × 5 each", "5 min". */
export function setsLabel(exercise: Exercise): string {
	if (exercise.unit === "min") return `${exercise.target ?? 0} min`;
	const amount =
		exercise.target === null
			? "max"
			: exercise.unit === "s"
				? `${exercise.target} s`
				: String(exercise.target);
	return `${exercise.sets} × ${amount}${exercise.each ? " each" : ""}`;
}

/** Boxing call-outs: 1 jab, 2 cross, 3 hook, 4 uppercut, plus defence. */
export const COMBOS: readonly string[][] = [
	["1", "2", "slip", "2", "roll", "3"],
	["1", "1", "2"],
	["1", "2", "3", "2"],
	["1", "2", "roll", "2", "3"],
	["3", "2", "3"],
	["1", "6", "3", "2"],
];

export const COMBO_WORDS: Record<string, string> = {
	"1": "jab",
	"2": "cross",
	"3": "hook",
	"4": "hook",
	"5": "uppercut",
	"6": "uppercut",
	slip: "slip",
	roll: "roll",
};

export const ROUND_FOCUS: readonly string[] = [
	"Stance and breathing. Light on the balls of your feet, exhale on every punch.",
	"Snap the jab back to your face as fast as it went out.",
	"Turn the hip on the cross; the power is in the floor.",
	"Hands back to the chin after every punch. Stay light on the balls of your feet.",
	"Move your head after every combo: slip or roll, then reset.",
	"Empty the tank: fast, clean combos for the last minute.",
];

/**
 * A session saved with a live workout (program sessions change as levels move, so the one being
 * trained is kept as it was). Only kept on the phone; anything malformed reads as no snapshot.
 */
export function parseTemplate(raw: unknown): Template | null {
	if (!isRecord(raw)) return null;
	const id = asString(raw.id, "");
	const title = asString(raw.title, "");
	const sport = asString(raw.sport, "");
	if (!id || !title || !(SPORTS as readonly string[]).includes(sport)) return null;
	const exercises = asArray(raw.exercises, (item): Exercise | null => {
		if (!isRecord(item)) return null;
		const name = asString(item.name, "");
		const unit = item.unit === "s" || item.unit === "min" ? item.unit : "reps";
		if (!name) return null;
		return {
			...(item as Partial<Exercise>),
			name,
			photo: asString(item.photo, ""),
			sets: Math.max(1, Math.round(asNumber(item.sets, 1))),
			target: typeof item.target === "number" ? item.target : null,
			unit,
			restS: Math.max(0, Math.round(asNumber(item.restS, 0))),
			note: asString(item.note, ""),
		};
	});
	if (exercises.length === 0) return null;
	return { ...(raw as Partial<Template>), id, title, sport: sport as Sport, exercises } as Template;
}
