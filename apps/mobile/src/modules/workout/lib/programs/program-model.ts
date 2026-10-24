import { asArray, asNumber, asString, isRecord, oneOf } from "@/lib/storage/parse";
import { EQUIPMENT, type Equipment, exerciseById } from "../exercise-guide";
import { SPORTS, type Sport } from "../training-model";

/**
 * Programs: a goal over a number of weeks, made of sessions whose exercises progress. A session item
 * is either a chain (a ladder of variations: incline push-up → push-up → … → one-arm push-up; the
 * person's level picks the rung) or one fixed exercise. Built-in programs live in code; programs
 * people design (by hand or with AI) are stored and synced.
 */

export const CHAIN_IDS = [
	"push",
	"vertical-push",
	"dip",
	"pull",
	"row",
	"lever",
	"squat",
	"hinge",
	"core",
	"handstand",
] as const;
export type ChainId = (typeof CHAIN_IDS)[number];

/** Easiest first. Rungs that need equipment someone lacks are stepped over. */
export const CHAINS: Record<ChainId, readonly string[]> = {
	push: [
		"incline-push-up",
		"push-up",
		"diamond-push-up",
		"decline-push-up",
		"archer-push-up",
		"pseudo-planche-push-up",
		"one-arm-push-up",
	],
	"vertical-push": ["pike-push-up", "elevated-pike-push-up", "wall-hspu-negative", "wall-hspu"],
	dip: ["bench-dip", "dips", "straight-bar-dip", "ring-dip"],
	pull: [
		"scapular-pull-up",
		"negative-pull-up",
		"chin-up",
		"pull-up",
		"chest-to-bar",
		"archer-pull-up",
		"muscle-up",
	],
	row: ["australian-row", "feet-up-row", "archer-row"],
	lever: ["tuck-front-lever", "advanced-tuck-lever", "straddle-front-lever"],
	squat: [
		"bodyweight-squat",
		"split-squat",
		"bulgarian-split-squat",
		"shrimp-squat",
		"pistol-squat",
	],
	hinge: ["glute-bridge", "single-leg-glute-bridge", "single-leg-rdl", "nordic-curl"],
	core: [
		"dead-bug",
		"plank",
		"hollow-hold",
		"hanging-knee-raise",
		"hanging-leg-raise",
		"toes-to-bar",
	],
	handstand: ["wall-walk", "wall-handstand", "chest-to-wall-handstand", "freestanding-handstand"],
};

export const CHAIN_LABELS: Record<ChainId, string> = {
	push: "Push-ups",
	"vertical-push": "Overhead push",
	dip: "Dips",
	pull: "Pull-ups",
	row: "Rows",
	lever: "Front lever",
	squat: "Squats",
	hinge: "Hips and hamstrings",
	core: "Core",
	handstand: "Handstand",
};

/** [low, high]: reps, seconds or minutes, by the exercise's unit. */
export type Range = readonly [number, number];

export type ProgramItem =
	| {
			kind: "chain";
			chain: ChainId;
			sets: number;
			/** Reps for rep exercises. */
			range: Range;
			/** Seconds for holds on the same chain (plank, handstand, lever). */
			hold: Range;
			restS: number;
	  }
	| {
			kind: "exercise";
			exercise: string;
			sets: number;
			range: Range;
			restS: number;
			/** Weekly growth for timed work (runs): 0.08 adds 8% a week up to the range's top. */
			grow?: number;
	  };

export const FOCUSES = [
	"upper",
	"lower",
	"full",
	"run",
	"boxing",
	"skill",
	"conditioning",
	"mobility",
] as const;
export type Focus = (typeof FOCUSES)[number];

export type ProgramSession = {
	/** Unique within the program. */
	key: string;
	title: string;
	sport: Sport;
	focus: Focus;
	minutes: number;
	effort: number;
	items: ProgramItem[];
	/** Boxing: rounds start at `start` and grow by one every two weeks up to `max`. */
	rounds?: { start: number; max: number; roundMin: number; restMin: number };
};

export const LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type ProgramLevel = (typeof LEVELS)[number];

export const PROGRAM_KINDS = [
	"hybrid",
	"strength",
	"skill",
	"running",
	"boxing",
	"conditioning",
	"recovery",
	"gym",
] as const;
export type ProgramKind = (typeof PROGRAM_KINDS)[number];

export type ProgramDef = {
	id: string;
	title: string;
	goal: string;
	summary: string;
	kind: ProgramKind;
	weeks: number;
	level: ProgramLevel;
	sports: Sport[];
	/** Equipment the program assumes; exercises fall back to what someone has. */
	equipment: Equipment[];
	photo: string;
	sessions: ProgramSession[];
	/** Session keys for a week, by training days a week (2–7). Missing counts use the nearest. */
	schedule: Partial<Record<number, string[]>>;
	/** Every Nth week is lighter; null for none. */
	deloadEvery: number | null;
	/** Week 1 and the last week test maximums, which set the starting targets and show progress. */
	testWeeks: boolean;
	source: "built-in" | "custom" | "ai";
	createdAt: string | null;
};

/** One chain's or exercise's level, kept per person and synced (`training-progress`). */
export type Progress = {
	/** A chain id or an exercise id. */
	id: string;
	/** The rung on the chain; 0 for a fixed exercise. */
	step: number;
	/** The number to hit on every set next time. */
	target: number;
	/** Weighted lifts: the load in kilograms. */
	kg: number | null;
	/** Sessions in a row that fell short of the range; two in a row step back. */
	misses: number;
	updatedAt: string;
};

export type FixedDay = {
	/** 0 = Monday. */
	weekday: number;
	/** The activity id that day ("sport:football" for days saved before activities). */
	activity: string;
};

export type ActiveProgram = { id: string; startedOn: string };

// --- parsing ------------------------------------------------------------------------------------

const clampInt = (value: unknown, min: number, max: number, fallback: number) =>
	Math.min(max, Math.max(min, Math.round(asNumber(value, fallback))));

function parseRange(raw: unknown, fallback: Range, max: number): Range {
	if (!Array.isArray(raw)) return fallback;
	const low = clampInt(raw[0], 1, max, fallback[0]);
	const high = clampInt(raw[1], low, max, Math.max(low, fallback[1]));
	return [low, high];
}

export function parseItem(raw: unknown): ProgramItem | null {
	if (!isRecord(raw)) return null;
	const sets = clampInt(raw.sets, 1, 10, 3);
	const restS = clampInt(raw.restS, 0, 600, 60);
	if (raw.kind === "chain") {
		const chain = oneOf(raw.chain, CHAIN_IDS, "push");
		if (raw.chain !== chain) return null;
		return {
			kind: "chain",
			chain,
			sets,
			range: parseRange(raw.range, [6, 12], 100),
			hold: parseRange(raw.hold, [15, 30], 300),
			restS,
		};
	}
	const exercise = asString(raw.exercise, "");
	if (!exerciseById(exercise)) return null;
	const grow = asNumber(raw.grow, 0);
	return {
		kind: "exercise",
		exercise,
		sets,
		range: parseRange(raw.range, [8, 12], 600),
		restS,
		...(grow > 0 ? { grow: Math.min(0.2, grow) } : {}),
	};
}

function parseSession(raw: unknown, index: number): ProgramSession | null {
	if (!isRecord(raw)) return null;
	const items = asArray(raw.items, parseItem).slice(0, 12);
	const title = asString(raw.title, "").trim().slice(0, 40);
	if (!title || items.length === 0) return null;
	const sport = oneOf(raw.sport, SPORTS, "calisthenics");
	const rounds = isRecord(raw.rounds)
		? {
				start: clampInt(raw.rounds.start, 1, 15, 5),
				max: clampInt(raw.rounds.max, 1, 15, 8),
				roundMin: clampInt(raw.rounds.roundMin, 1, 5, 3),
				restMin: clampInt(raw.rounds.restMin, 0, 3, 1),
			}
		: undefined;
	return {
		key: asString(raw.key, "").trim().slice(0, 30) || `session-${index + 1}`,
		title,
		sport,
		focus: oneOf(raw.focus, FOCUSES, "full"),
		minutes: clampInt(raw.minutes, 10, 180, 45),
		effort: clampInt(raw.effort, 1, 10, 6),
		items,
		...(rounds ? { rounds: { ...rounds, max: Math.max(rounds.start, rounds.max) } } : {}),
	};
}

/** A designed program from storage; anything malformed falls back or is dropped. */
export function parseProgram(raw: unknown): ProgramDef | null {
	if (!isRecord(raw)) return null;
	const id = asString(raw.id, "");
	const title = asString(raw.title, "").trim().slice(0, 60);
	const sessions = asArray(raw.sessions, (item) => item)
		.map((item, index) => parseSession(item, index))
		.filter((item): item is ProgramSession => item !== null)
		.slice(0, 7);
	if (!id || !title || sessions.length === 0) return null;
	const keys = new Set<string>();
	for (const session of sessions) {
		while (keys.has(session.key)) session.key = `${session.key}-2`;
		keys.add(session.key);
	}
	const schedule: Partial<Record<number, string[]>> = {};
	if (isRecord(raw.schedule)) {
		for (const [days, list] of Object.entries(raw.schedule)) {
			const count = Number(days);
			if (!Number.isInteger(count) || count < 1 || count > 7) continue;
			const order = asArray(list, (key) =>
				typeof key === "string" && keys.has(key) ? key : null,
			).slice(0, count);
			if (order.length > 0) schedule[count] = order;
		}
	}
	const sports = asArray(raw.sports, (item) =>
		typeof item === "string" && (SPORTS as readonly string[]).includes(item)
			? (item as Sport)
			: null,
	);
	const deload = asNumber(raw.deloadEvery, 0);
	return {
		id,
		title,
		goal: asString(raw.goal, "").trim().slice(0, 120),
		summary: asString(raw.summary, "").trim().slice(0, 400),
		kind: oneOf(raw.kind, PROGRAM_KINDS, "strength"),
		weeks: clampInt(raw.weeks, 1, 24, 8),
		level: oneOf(raw.level, LEVELS, "beginner"),
		sports: sports.length > 0 ? [...new Set(sports)] : [...new Set(sessions.map((s) => s.sport))],
		equipment: asArray(raw.equipment, (item) =>
			typeof item === "string" && (EQUIPMENT as readonly string[]).includes(item)
				? (item as Equipment)
				: null,
		),
		photo: asString(raw.photo, "handstand"),
		sessions,
		schedule,
		deloadEvery: deload >= 2 ? Math.round(deload) : null,
		testWeeks: raw.testWeeks === true,
		source: raw.source === "ai" ? "ai" : "custom",
		createdAt: typeof raw.createdAt === "string" ? raw.createdAt : null,
	};
}

export function parseProgress(raw: unknown): Progress | null {
	if (!isRecord(raw)) return null;
	const id = asString(raw.id, "");
	if (!id) return null;
	const kg = asNumber(raw.kg, -1);
	return {
		id,
		step: clampInt(raw.step, 0, 20, 0),
		target: clampInt(raw.target, 1, 600, 8),
		kg: kg > 0 ? Math.round(kg * 2) / 2 : null,
		misses: clampInt(raw.misses, 0, 10, 0),
		updatedAt: asString(raw.updatedAt, new Date(0).toISOString()),
	};
}
