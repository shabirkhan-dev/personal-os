import { newId } from "@/lib/day";
import { allExercises, canDo, type Equipment, exerciseById } from "../exercise-guide";
import { SPORTS, type Sport } from "../training-model";
import {
	CHAINS,
	type ChainId,
	FOCUSES,
	type Focus,
	type ProgramDef,
	type ProgramItem,
	type ProgramLevel,
	type ProgramSession,
} from "./program-model";

/** What `POST /ai/training/program` returns. */
export type ProgramDraft = {
	title: string;
	summary: string;
	weeks: number;
	sessions: {
		title: string;
		sport: string;
		focus: string;
		minutes: number;
		items: { exercise: string; sets: number; range: [number, number]; restS: number }[];
	}[];
	order: number[];
};

export type DraftRequest = {
	goal: string;
	level: ProgramLevel;
	weeks: number;
	daysPerWeek: number;
	minutes: number;
	sports: Sport[];
	equipment: Equipment[];
};

/** The exercises sent to the AI: what someone can do, with sport blocks left out. */
export function draftCatalog(equipment: readonly Equipment[]) {
	return allExercises()
		.filter((exercise) => exercise.pattern !== "sport" && canDo(exercise, equipment))
		.map((exercise) => ({
			id: exercise.id,
			name: exercise.name,
			pattern: exercise.pattern,
			level: exercise.level,
			unit: exercise.unit,
		}));
}

function chainOf(exerciseId: string): ChainId | null {
	for (const [chain, rungs] of Object.entries(CHAINS)) {
		if (rungs.includes(exerciseId)) return chain as ChainId;
	}
	return null;
}

/**
 * An exercise on a chain becomes a chain item, so it moves up variations like the built-in
 * programs; a hold keeps its seconds as the chain's hold range.
 */
export function itemFor(
	item: ProgramDraft["sessions"][number]["items"][number],
): ProgramItem | null {
	const exercise = exerciseById(item.exercise);
	if (!exercise) return null;
	const chain = chainOf(exercise.id);
	const range = [item.range[0], Math.max(item.range[0], item.range[1])] as const;
	if (chain && exercise.unit !== "min") {
		return {
			kind: "chain",
			chain,
			sets: item.sets,
			range: exercise.unit === "reps" ? range : [8, 12],
			hold: exercise.unit === "s" ? range : [20, 40],
			restS: item.restS,
		};
	}
	return { kind: "exercise", exercise: exercise.id, sets: item.sets, range, restS: item.restS };
}

/** Turns an AI draft into a program to review and save. */
export function programFromDraft(
	draft: ProgramDraft,
	request: DraftRequest,
	now = new Date(),
): ProgramDef {
	const sessions: ProgramSession[] = draft.sessions
		.map((session, index) => ({
			key: `s${index + 1}`,
			title: session.title,
			sport: (SPORTS as readonly string[]).includes(session.sport)
				? (session.sport as Sport)
				: "calisthenics",
			focus: (FOCUSES as readonly string[]).includes(session.focus)
				? (session.focus as Focus)
				: "full",
			minutes: session.minutes,
			effort: 6,
			items: session.items.map(itemFor).filter((item): item is ProgramItem => item !== null),
		}))
		.filter((session) => session.items.length > 0);
	const order = draft.order
		.map((index) => sessions[index]?.key)
		.filter((key): key is string => key !== undefined);
	return {
		id: newId(),
		title: draft.title,
		goal: request.goal.slice(0, 120),
		summary: draft.summary,
		kind: "strength",
		weeks: draft.weeks,
		level: request.level,
		sports: [...new Set(sessions.map((session) => session.sport))],
		equipment: request.equipment,
		photo: "handstand",
		sessions,
		schedule: order.length > 0 ? { [order.length]: order } : {},
		deloadEvery: draft.weeks >= 6 ? 4 : null,
		testWeeks: sessions.some((session) => session.items.some((item) => item.kind === "chain")),
		source: "ai",
		createdAt: now.toISOString(),
	};
}
