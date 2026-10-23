import { asArray, asNumber, asString, isRecord } from "@/lib/storage/parse";
import { SPORTS, type Sport } from "./training-model";

/**
 * The sessions Training plans from: bodyweight, running, shadow boxing and mobility for phase 1
 * (no gym yet), team sports for phase 2. Photos come from the Figma "Training · Photo assets"
 * frame.
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

const ex = (
	name: string,
	photo: string,
	sets: number,
	target: number | null,
	unit: Exercise["unit"],
	restS: number,
	note: string,
	each = false,
): Exercise => ({ name, photo, sets, target, unit, restS, note, ...(each ? { each } : {}) });

const WARM_UP = ex("Wrist and shoulder warm-up", "yoga", 1, 5, "min", 0, "Warm-up");

export const TEMPLATES: readonly Template[] = [
	{
		id: "push-handstand",
		title: "Push + handstand",
		sport: "calisthenics",
		photo: "handstand",
		hero: "handstand-hero",
		minutes: 45,
		effort: 7,
		short: "45 min",
		exercises: [
			WARM_UP,
			ex("Wall handstand hold", "handstand", 4, 30, "s", 90, "Rest 90 s"),
			ex("Pike push-ups", "push-ups", 4, 8, "reps", 90, "Rest 90 s"),
			ex("Dips", "dips", 4, 10, "reps", 90, "Rest 90 s"),
			ex("Push-ups", "push-ups", 3, null, "reps", 90, "Rest 90 s"),
			ex("Pistol squat", "pistol-squat", 3, 5, "reps", 90, "Rest 90 s", true),
			ex("Hollow hold", "yoga", 3, 30, "s", 45, "Core finisher"),
		],
	},
	{
		id: "pull-core",
		title: "Pull + core",
		sport: "calisthenics",
		photo: "pull-ups",
		hero: "pull-ups",
		minutes: 48,
		effort: 7,
		short: "48 min",
		exercises: [
			WARM_UP,
			ex("Pull-ups", "pull-ups", 5, null, "reps", 120, "Rest 2 min"),
			ex("Australian rows", "pull-ups", 4, 10, "reps", 90, "Rest 90 s"),
			ex("Tuck front lever", "pull-ups", 4, 10, "s", 90, "Rest 90 s"),
			ex("Hanging knee raises", "pull-ups", 3, 12, "reps", 60, "Rest 60 s"),
			ex("Plank", "push-ups", 3, 45, "s", 45, "Core finisher"),
		],
	},
	{
		id: "legs-core",
		title: "Legs + core",
		sport: "calisthenics",
		photo: "pistol-squat",
		hero: "pistol-squat",
		minutes: 40,
		effort: 6,
		short: "40 min",
		exercises: [
			WARM_UP,
			ex("Pistol squat", "pistol-squat", 4, 5, "reps", 90, "Rest 90 s", true),
			ex("Jump squats", "pistol-squat", 4, 12, "reps", 60, "Rest 60 s"),
			ex("Walking lunges", "pistol-squat", 3, 20, "reps", 60, "Rest 60 s"),
			ex("Hollow hold", "yoga", 3, 30, "s", 45, "Core finisher"),
		],
	},
	{
		id: "easy-run",
		title: "Easy run",
		sport: "running",
		photo: "mountain-run",
		hero: "mountain-run-hero",
		minutes: 30,
		effort: 4,
		distanceKm: 5,
		short: "5 km",
		exercises: [ex("Easy run", "mountain-run", 1, 30, "min", 0, "Talk-easy pace")],
	},
	{
		id: "long-run",
		title: "Long run",
		sport: "running",
		photo: "mountain-run",
		hero: "mountain-run-hero",
		minutes: 50,
		effort: 6,
		distanceKm: 8,
		short: "8 km",
		exercises: [ex("Long run", "mountain-run", 1, 50, "min", 0, "Steady, finish strong")],
	},
	{
		id: "shadow-boxing",
		title: "Shadow boxing",
		sport: "boxing",
		photo: "shadow-boxing",
		hero: "shadow-boxing",
		minutes: 24,
		effort: 7,
		rounds: 6,
		roundMin: 3,
		restMin: 1,
		short: "6 rounds",
		exercises: [ex("Rounds", "shadow-boxing", 6, 3, "min", 60, "1 min rest between rounds")],
	},
	{
		id: "mobility",
		title: "Mobility + yoga",
		sport: "yoga",
		photo: "yoga",
		hero: "yoga",
		minutes: 25,
		effort: 2,
		short: "25 min",
		exercises: [
			ex("Cat-cow and spine waves", "yoga", 1, 3, "min", 0, "Slow"),
			ex("Low lunge", "yoga", 2, 45, "s", 0, "Each side", true),
			ex("Downward dog", "yoga", 3, 45, "s", 0, "Breathe out long"),
			ex("Pigeon stretch", "yoga", 2, 60, "s", 0, "Each side", true),
			ex("Wrist circles and prep", "yoga", 1, 2, "min", 0, "Before handstands"),
		],
	},
	{
		id: "football",
		title: "Football",
		sport: "football",
		photo: "football",
		hero: "football",
		minutes: 75,
		effort: 7,
		short: "75 min",
		exercises: [ex("Match or training", "football", 1, 75, "min", 0, "With the team")],
	},
	{
		id: "volleyball",
		title: "Volleyball",
		sport: "volleyball",
		photo: "volleyball",
		hero: "volleyball",
		minutes: 75,
		effort: 6,
		short: "75 min",
		exercises: [ex("Match or training", "volleyball", 1, 75, "min", 0, "With the team")],
	},
];

/** Program sessions are made on the fly from the program and the person's levels. */
let resolveGenerated: ((id: string) => Template | undefined) | null = null;

/** Lets the data layer resolve generated ids ("p:hybrid-athlete:3:push") once it has loaded. */
export function setTemplateResolver(resolver: ((id: string) => Template | undefined) | null): void {
	resolveGenerated = resolver;
}

export function templateById(id: string | null | undefined): Template | undefined {
	if (!id) return undefined;
	return TEMPLATES.find((template) => template.id === id) ?? resolveGenerated?.(id);
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

export type SkillTemplate = { name: string; sport: Sport; photo: string; steps: string[] };

/** Skills to work toward, each as a ladder of small steps. */
export const SKILLS: readonly SkillTemplate[] = [
	{
		name: "Handstand",
		sport: "calisthenics",
		photo: "handstand",
		steps: [
			"Wall plank 3 × 30 s",
			"Chest-to-wall hold 3 × 30 s",
			"Chest-to-wall hold 3 × 60 s",
			"10 s away from the wall",
			"Kick-up to 20 s free hold",
			"60 s free hold",
		],
	},
	{
		name: "Muscle-up",
		sport: "calisthenics",
		photo: "pull-ups",
		steps: [
			"12 strict pull-ups",
			"Explosive chest-to-bar pull-ups",
			"15 straight-bar dips",
			"Negative muscle-ups 3 × 3",
			"First strict muscle-up",
		],
	},
	{
		name: "Pistol squat",
		sport: "calisthenics",
		photo: "pistol-squat",
		steps: [
			"Box pistol 3 × 5",
			"Counterweight pistol 3 × 5",
			"Assisted pistol 3 × 5",
			"Pistol 3 × 3",
			"Pistol 3 × 5 each",
		],
	},
	{
		name: "Front lever",
		sport: "calisthenics",
		photo: "pull-ups",
		steps: [
			"Tuck lever 3 × 10 s",
			"Advanced tuck 3 × 10 s",
			"One leg 3 × 8 s",
			"Straddle 3 × 6 s",
			"Half lay 3 × 5 s",
			"Full front lever 5 s",
		],
	},
	{
		name: "Jab-cross speed",
		sport: "boxing",
		photo: "shadow-boxing",
		steps: [
			"20 clean combos in a round",
			"40 clean combos in a round",
			"60 clean combos in a round",
			"Add a slip after every combo",
		],
	},
	{
		name: "5 km under 25 min",
		sport: "running",
		photo: "mountain-run",
		steps: [
			"Run 5 km without stopping",
			"5 km under 30 min",
			"5 km under 27 min",
			"5 km under 25 min",
		],
	},
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
