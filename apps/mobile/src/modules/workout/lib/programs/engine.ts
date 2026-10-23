import { addDays, dayKey } from "@/lib/day";
import {
	CATALOG,
	type CatalogExercise,
	canDo,
	type Equipment,
	exerciseById,
	exerciseByName,
} from "../exercise-guide";
import type { Exercise, Template } from "../library";
import { SPREAD } from "../training-math";
import type { Feel, PlanSlot, SetLog, Sport, TrainingSettings } from "../training-model";
import {
	CHAINS,
	type ChainId,
	type ProgramDef,
	type ProgramItem,
	type ProgramLevel,
	type ProgramSession,
	type Progress,
	type Range,
} from "./program-model";

/** How programs become weeks and sessions, and how levels move. Pure, so it is tested off the phone. */

export type WeekKind = "build" | "deload" | "test";

export type ProgramContext = {
	programs: readonly ProgramDef[];
	progress: ReadonlyMap<string, Progress>;
	settings: Pick<
		TrainingSettings,
		"equipment" | "minutes" | "daysPerWeek" | "fixedDays" | "sports"
	>;
};

/** Team sports someone can pin to a weekday, with the session that day shows. */
export const TEAM_TEMPLATES: Partial<Record<Sport, string>> = {
	football: "football",
	volleyball: "volleyball",
};

const DAY_MS = 86_400_000;
const at = (day: string) => new Date(`${day}T12:00:00`).getTime();

export function programById(
	programs: readonly ProgramDef[],
	id: string | null | undefined,
): ProgramDef | undefined {
	return id ? programs.find((program) => program.id === id) : undefined;
}

/** The Monday of the week `day` falls in. */
export function mondayOf(day: string): string {
	const date = new Date(`${day}T12:00:00`);
	return dayKey(addDays(date, -((date.getDay() + 6) % 7)));
}

/** Which week of the program `day` is in, starting at 1. */
export function weekNumber(startedOn: string, day: string): number {
	return Math.floor((at(mondayOf(day)) - at(mondayOf(startedOn))) / DAY_MS / 7) + 1;
}

export function weekKind(program: ProgramDef, week: number): WeekKind {
	if (program.testWeeks && (week === 1 || week === program.weeks)) return "test";
	if (program.deloadEvery && week % program.deloadEvery === 0 && week !== program.weeks) {
		return "deload";
	}
	return "build";
}

/** The sessions for a week of `days` training days, in order. */
export function sessionOrder(program: ProgramDef, days: number): string[] {
	const wanted = Math.min(7, Math.max(1, days));
	for (let count = wanted; count >= 1; count -= 1) {
		const order = program.schedule[count];
		if (order && order.length > 0) return order.slice(0, wanted);
	}
	for (let count = wanted + 1; count <= 7; count += 1) {
		const order = program.schedule[count];
		if (order && order.length > 0) return order.slice(0, wanted);
	}
	const keys = program.sessions.map((session) => session.key);
	return Array.from({ length: Math.min(wanted, Math.max(keys.length, 1) * 2) }, (_, index) =>
		String(keys[index % keys.length]),
	);
}

export function templateId(programId: string, week: number, key: string): string {
	return `p:${programId}:${week}:${key}`;
}

export function parseTemplateId(
	id: string,
): { programId: string; week: number; key: string } | null {
	const match = /^p:(.+):(\d+):([^:]+)$/.exec(id);
	if (!match) return null;
	return { programId: String(match[1]), week: Number(match[2]), key: String(match[3]) };
}

// --- exercises --------------------------------------------------------------------------------------

const LEVEL_START: Record<ProgramLevel, number> = { beginner: 1, intermediate: 3, advanced: 5 };

/** Where a chain starts for someone with no history: the first rung at the program's level. */
export function defaultStep(chain: ChainId, level: ProgramLevel): number {
	const rungs = CHAINS[chain];
	const index = rungs.findIndex((id) => (exerciseById(id)?.level ?? 0) >= LEVEL_START[level]);
	return index === -1 ? rungs.length - 1 : index;
}

/** The rung to train: the person's step, or the nearest easier one they have the equipment for. */
export function pickRung(
	chain: ChainId,
	step: number,
	equipment: readonly Equipment[],
): { exercise: CatalogExercise; step: number } | null {
	const rungs = CHAINS[chain];
	const start = Math.min(rungs.length - 1, Math.max(0, step));
	const order = [
		...Array.from({ length: start + 1 }, (_, index) => start - index),
		...Array.from({ length: rungs.length - start - 1 }, (_, index) => start + 1 + index),
	];
	for (const index of order) {
		const exercise = exerciseById(String(rungs[index]));
		if (exercise && canDo(exercise, equipment)) return { exercise, step: index };
	}
	return null;
}

/** A doable stand-in from the same pattern at the closest level, easier first on a tie. */
export function substitute(
	exercise: CatalogExercise,
	equipment: readonly Equipment[],
): CatalogExercise | null {
	if (canDo(exercise, equipment)) return exercise;
	const options = CATALOG.filter(
		(candidate) =>
			candidate.pattern === exercise.pattern &&
			candidate.id !== exercise.id &&
			canDo(candidate, equipment),
	);
	options.sort(
		(a, b) =>
			Math.abs(a.level - exercise.level) - Math.abs(b.level - exercise.level) || a.level - b.level,
	);
	return options[0] ?? null;
}

const clamp = (value: number, range: Range) => Math.min(range[1], Math.max(range[0], value));

const rangeLabel = (range: Range, unit: string) =>
	range[0] === range[1] ? `${range[0]} ${unit}` : `${range[0]}–${range[1]} ${unit}`;

function restNote(restS: number): string {
	if (!restS) return "";
	return restS >= 60 && restS % 60 === 0 ? ` · rest ${restS / 60} min` : ` · rest ${restS} s`;
}

function build(
	item: ProgramItem,
	kind: WeekKind,
	week: number,
	program: ProgramDef,
	ctx: ProgramContext,
): Exercise | null {
	if (item.kind === "chain") {
		const saved = ctx.progress.get(item.chain);
		const rung = pickRung(
			item.chain,
			saved?.step ?? defaultStep(item.chain, program.level),
			ctx.settings.equipment,
		);
		if (!rung) return null;
		const { exercise } = rung;
		const unit = exercise.unit === "s" ? "s" : "reps";
		const range = unit === "s" ? item.hold : item.range;
		const progress = {
			key: item.chain,
			step: rung.step,
			range,
			chainLength: CHAINS[item.chain].length,
		};
		const base = {
			name: exercise.name,
			photo: exercise.photo,
			unit,
			restS: item.restS,
			progress,
			...(exercise.each ? { each: true } : {}),
		} as const;
		if (kind === "test") {
			return {
				...base,
				sets: 1,
				target: null,
				restS: 120,
				note: "Test: as many clean as you can",
			};
		}
		const target =
			kind === "deload" || !saved || saved.step !== rung.step
				? range[0]
				: clamp(saved.target, range);
		return {
			...base,
			sets: kind === "deload" ? Math.max(1, item.sets - 1) : item.sets,
			target,
			note: `${kind === "deload" ? "Light week · " : ""}Aim ${rangeLabel(range, unit === "s" ? "s" : "reps")}${restNote(item.restS)}`,
		};
	}

	const planned = exerciseById(item.exercise);
	const exercise = planned ? substitute(planned, ctx.settings.equipment) : null;
	if (!exercise) return null;
	const unit = exercise.unit;
	const range = item.range;
	const each = exercise.each ? { each: true } : {};
	if (unit === "min") {
		const grown = item.grow
			? Math.min(range[1], Math.round(range[0] * (1 + item.grow * (week - 1))))
			: range[0];
		const target = kind === "deload" ? Math.max(1, Math.round(grown * 0.7)) : grown;
		return {
			name: exercise.name,
			photo: exercise.photo,
			sets: item.sets,
			target,
			unit,
			restS: item.restS,
			note: `${kind === "deload" ? "Light week · " : ""}${item.sets > 1 ? `${item.sets} × ${target} min` : `${target} min`}${restNote(item.restS)}`,
			...each,
		};
	}
	const saved = ctx.progress.get(exercise.id);
	const moves = range[0] < range[1];
	const target = kind === "deload" || !saved ? range[0] : clamp(saved.target, range);
	return {
		name: exercise.name,
		photo: exercise.photo,
		sets: kind === "deload" ? Math.max(1, item.sets - 1) : item.sets,
		target,
		unit,
		restS: item.restS,
		note: `${kind === "deload" ? "Light week · " : ""}${moves ? `Aim ${rangeLabel(range, unit === "s" ? "s" : "reps")}` : rangeLabel(range, unit === "s" ? "s" : "reps")}${restNote(item.restS)}`,
		...each,
		...(moves ? { progress: { key: exercise.id, step: 0, range, chainLength: 1 } } : {}),
		...(exercise.weighted ? { weighted: true, kg: saved?.kg ?? null } : {}),
	};
}

/** Seconds an exercise takes, rest included: a rep is about three seconds. */
function secondsOf(exercise: Exercise): number {
	const amount =
		exercise.unit === "min"
			? (exercise.target ?? 1) * 60
			: exercise.unit === "s"
				? (exercise.target ?? 30)
				: (exercise.target ?? 10) * 3;
	return exercise.sets * (amount * (exercise.each ? 2 : 1) + exercise.restS);
}

export function estimateMinutes(exercises: readonly Exercise[]): number {
	const total = exercises.reduce((sum, exercise) => sum + secondsOf(exercise), 0);
	return Math.max(5, Math.ceil(total / 60 / 5) * 5);
}

const totalSeconds = (list: readonly Exercise[]) =>
	list.reduce((sum, item) => sum + secondsOf(item), 0);

const isWarmUp = (exercise: Exercise) =>
	exercise.unit === "min" && exerciseByName(exercise.name)?.pattern === "mobility";

/**
 * Trims a session to the minutes someone has: the last exercises go first (the warm-up and the
 * first two main exercises stay), then extra sets.
 */
export function fitToMinutes(exercises: readonly Exercise[], minutes: number): Exercise[] {
	const budget = minutes * 60;
	const list = [...exercises];
	const keep = (list[0] && isWarmUp(list[0]) ? 1 : 0) + 2;
	while (totalSeconds(list) > budget && list.length > keep) list.pop();
	if (totalSeconds(list) <= budget) return list;
	const trimmed: Exercise[] = [];
	for (const exercise of list) {
		trimmed.push(
			exercise.sets > 2 ? Object.assign({}, exercise, { sets: exercise.sets - 1 }) : exercise,
		);
	}
	return trimmed;
}

// --- sessions ---------------------------------------------------------------------------------------

function roundsFor(session: ProgramSession, kind: WeekKind, week: number): number {
	const rounds = session.rounds;
	if (!rounds) return 0;
	if (kind === "deload") return Math.max(3, rounds.start - 2);
	return Math.min(rounds.max, rounds.start + Math.floor((week - 1) / 2));
}

/** One program session for one week, as a session the live screens can run. */
export function materialize(
	program: ProgramDef,
	key: string,
	week: number,
	ctx: ProgramContext,
): Template | undefined {
	const session = program.sessions.find((item) => item.key === key);
	if (!session) return undefined;
	const kind = weekKind(program, week);
	const id = templateId(program.id, week, key);
	const meta = { id: program.id, title: program.title, week, kind };

	if (session.rounds) {
		const rounds = roundsFor(session, kind, week);
		const { roundMin, restMin } = session.rounds;
		const minutes = rounds * (roundMin + restMin);
		return {
			id,
			title: session.title,
			sport: session.sport,
			photo: "shadow-boxing",
			hero: "shadow-boxing",
			minutes,
			effort: kind === "deload" ? Math.max(1, session.effort - 2) : session.effort,
			exercises: [
				{
					name: "Rounds",
					photo: "shadow-boxing",
					sets: rounds,
					target: roundMin,
					unit: "min",
					restS: restMin * 60,
					note: `${restMin} min rest between rounds`,
				},
			],
			rounds,
			roundMin,
			restMin,
			short: `${rounds} rounds`,
			program: meta,
		};
	}

	const built = session.items
		.map((item) => build(item, kind, week, program, ctx))
		.filter((item): item is Exercise => item !== null);
	if (built.length === 0) return undefined;
	const timed = session.focus === "run" || session.focus === "mobility";
	const exercises = timed ? built : fitToMinutes(built, ctx.settings.minutes);
	const main = exercises.find((exercise) => !isWarmUp(exercise)) ?? exercises[0];
	const minutes =
		session.focus === "run"
			? exercises.reduce((sum, item) => sum + item.sets * (item.target ?? 0), 0) +
				(session.items.some((item) => item.kind === "exercise" && item.restS > 0) ? 10 : 0)
			: estimateMinutes(exercises);
	const photo = main?.photo ?? program.photo;
	return {
		id,
		title:
			kind === "test" && session.items.some((item) => item.kind === "chain")
				? `${session.title} · test`
				: session.title,
		sport: session.sport,
		photo,
		hero: photo,
		minutes,
		effort: kind === "deload" ? Math.max(1, session.effort - 2) : session.effort,
		exercises,
		short: `${minutes} min`,
		program: meta,
	};
}

/** Resolves a generated session id against the programs and levels in `ctx`. */
export function resolveTemplate(id: string, ctx: ProgramContext): Template | undefined {
	const parsed = parseTemplateId(id);
	if (!parsed) return undefined;
	const program = programById(ctx.programs, parsed.programId);
	return program ? materialize(program, parsed.key, parsed.week, ctx) : undefined;
}

// --- the week ---------------------------------------------------------------------------------------

/**
 * A program week: team days stay where they are, training days spread out around them, and a legs
 * session never lands the day before a match. Free days get mobility when yoga is picked.
 */
export function buildProgramWeek(
	program: ProgramDef,
	settings: ProgramContext["settings"],
	week: number,
	days: readonly string[],
): PlanSlot[] {
	const fixed = new Map(settings.fixedDays.map((day) => [day.weekday, day.sport]));
	const free = Array.from({ length: 7 }, (_, index) => index).filter((index) => !fixed.has(index));
	const order = sessionOrder(program, Math.min(settings.daysPerWeek, free.length)).slice(
		0,
		free.length,
	);
	const wanted = SPREAD[order.length] ?? free.slice(0, order.length);
	const chosen: number[] = [];
	for (const day of wanted) {
		const next =
			[day, ...free.filter((index) => index > day), ...free].find(
				(index) => !fixed.has(index) && !chosen.includes(index),
			) ?? null;
		if (next !== null) chosen.push(next);
	}
	chosen.sort((a, b) => a - b);
	const assigned = new Map(chosen.map((day, index) => [day, String(order[index])]));

	const focusOf = (key: string) => program.sessions.find((session) => session.key === key)?.focus;
	const beforeMatch = (day: number) => fixed.has(day + 1);
	for (const [day, key] of assigned) {
		if (focusOf(key) !== "lower" || !beforeMatch(day)) continue;
		const swap = [...assigned].find(
			([other, otherKey]) => other !== day && focusOf(otherKey) !== "lower" && !beforeMatch(other),
		);
		if (swap) {
			assigned.set(day, swap[1]);
			assigned.set(swap[0], key);
		}
	}

	return days.map((day, index) => {
		const team = fixed.get(index);
		if (team) return { day, template: TEAM_TEMPLATES[team] ?? null, movedFrom: null };
		const key = assigned.get(index);
		if (key) return { day, template: templateId(program.id, week, key), movedFrom: null };
		return {
			day,
			template: settings.sports.includes("yoga") ? "mobility" : null,
			movedFrom: null,
		};
	});
}

// --- progression ------------------------------------------------------------------------------------

type Ref = NonNullable<Exercise["progress"]>;

/**
 * Double progression. Every set at the target: the target goes up (by two after an easy session,
 * not at all after a hard one); past the top of the range the next variation starts at the bottom,
 * or weighted lifts add 2.5 kg. Two sessions in a row below the range step back a variation.
 * A test sets the target from the best set, and skips a rung when the range is far too easy.
 */
export function nextProgress(input: {
	current: Progress | null;
	ref: Ref;
	planned: { sets: number; target: number | null };
	values: readonly number[];
	kg: number | null;
	feel: Feel | null;
	test: boolean;
	weighted: boolean;
	now: string;
}): Progress | null {
	const { ref, planned, values, kg, feel, test, weighted, now } = input;
	if (values.length === 0) return null;
	const current = input.current ?? {
		id: ref.key,
		step: ref.step,
		target: planned.target ?? ref.range[0],
		kg: null,
		misses: 0,
		updatedAt: now,
	};
	const base: Progress = { ...current, id: ref.key, step: ref.step, updatedAt: now };
	const best = Math.max(...values);
	const load = kg ?? base.kg;

	if (test) {
		if (best > ref.range[1] * 1.5 && ref.step < ref.chainLength - 1) {
			return { ...base, step: ref.step + 1, target: ref.range[0], misses: 0 };
		}
		return { ...base, target: clamp(Math.round(best * 0.7), ref.range), misses: 0 };
	}

	const goal = planned.target ?? ref.range[0];
	const hitAll = values.length >= planned.sets && values.every((value) => value >= goal);
	if (hitAll) {
		const next = goal + (feel === "hard" ? 0 : feel === "easy" ? 2 : 1);
		if (next <= ref.range[1]) return { ...base, target: next, kg: load, misses: 0 };
		if (weighted) {
			return { ...base, target: ref.range[0], kg: (load ?? 0) + 2.5, misses: 0 };
		}
		if (ref.step < ref.chainLength - 1) {
			return { ...base, step: ref.step + 1, target: ref.range[0], kg: load, misses: 0 };
		}
		return { ...base, target: ref.range[1], kg: load, misses: 0 };
	}
	if (best < ref.range[0]) {
		const misses = current.misses + 1;
		if (misses >= 2 && ref.step > 0) {
			return { ...base, step: ref.step - 1, target: ref.range[1], kg: load, misses: 0 };
		}
		return { ...base, target: goal, kg: load, misses };
	}
	return { ...base, target: goal, kg: load, misses: 0 };
}

/** The levels a finished program session moves, from the sets logged in it. */
export function progressAfter(
	template: Template,
	sets: readonly SetLog[],
	feel: Feel | null,
	saved: ReadonlyMap<string, Progress>,
	now: string,
): Progress[] {
	const test = template.program?.kind === "test";
	const updates = new Map<string, Progress>();
	for (const exercise of template.exercises) {
		const ref = exercise.progress;
		if (!ref || updates.has(ref.key)) continue;
		const logged = sets.filter((set) => set.exercise === exercise.name);
		const kgs = logged.map((set) => set.kg).filter((kg): kg is number => kg !== undefined);
		const next = nextProgress({
			current: saved.get(ref.key) ?? null,
			ref,
			planned: { sets: exercise.sets, target: exercise.target },
			values: logged.map((set) => set.value),
			kg: kgs.length > 0 ? Math.max(...kgs) : null,
			feel,
			test,
			weighted: exercise.weighted === true,
			now,
		});
		if (next) updates.set(ref.key, next);
	}
	return [...updates.values()];
}

/** Starting levels someone picks when they start a program: the rung they can already do. */
export function startingProgress(
	steps: Partial<Record<ChainId, number>>,
	program: ProgramDef,
	now: string,
): Progress[] {
	return Object.entries(steps).map(([chain, step]) => {
		const id = chain as ChainId;
		const item = program.sessions
			.flatMap((session) => session.items)
			.find((candidate) => candidate.kind === "chain" && candidate.chain === id);
		const rung = exerciseById(String(CHAINS[id][step ?? 0]));
		const range =
			item?.kind === "chain" ? (rung?.unit === "s" ? item.hold : item.range) : ([8, 12] as Range);
		return { id, step: step ?? 0, target: range[0], kg: null, misses: 0, updatedAt: now };
	});
}

/** The chains a program trains, for "where are you now?" when starting it. */
export function chainsIn(program: ProgramDef): ChainId[] {
	const chains = program.sessions
		.flatMap((session) => session.items)
		.flatMap((item) => (item.kind === "chain" ? [item.chain] : []));
	return [...new Set(chains)];
}
