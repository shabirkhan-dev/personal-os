import { newId } from "@/lib/day";
import {
	allExercises,
	type CatalogExercise,
	canDo,
	type Equipment,
	exerciseById,
	parseSavedExercise,
} from "../exercise-guide";
import { SPORTS, type Sport } from "../training-model";
import {
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
	/** Exercises the AI defined for this program; items refer to them by `key`. */
	exercises: {
		key: string;
		name: string;
		pattern: string;
		unit: string;
		level: number;
		equipment: string[];
		each: boolean;
		weighted: boolean;
		cues: string[];
	}[];
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

/** The exercises an AI draft defines, as the person's own (ids made unique against theirs). */
export function exercisesFromDraft(draft: ProgramDraft): Map<string, CatalogExercise> {
	const taken = new Set(allExercises().map((exercise) => exercise.id));
	const out = new Map<string, CatalogExercise>();
	for (const raw of draft.exercises) {
		let id = `ex-${raw.key}`.slice(0, 50);
		while (taken.has(id)) id = `${id}-2`;
		const exercise = parseSavedExercise({ ...raw, id });
		if (!exercise) continue;
		taken.add(id);
		out.set(raw.key, exercise);
	}
	return out;
}

/**
 * Turns an AI draft into a program to review, with the new exercises it defines (save those as
 * the person's own before showing the program).
 */
export function programFromDraft(
	draft: ProgramDraft,
	request: DraftRequest,
	now = new Date(),
): { program: ProgramDef; exercises: CatalogExercise[] } {
	const created = exercisesFromDraft(draft);
	const idOf = (key: string) => created.get(key)?.id ?? key;
	const known = (id: string) =>
		exerciseById(id) ?? [...created.values()].find((item) => item.id === id);
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
			items: session.items
				.map((item): ProgramItem | null => {
					const exercise = known(idOf(item.exercise));
					if (!exercise) return null;
					const range = [item.range[0], Math.max(item.range[0], item.range[1])] as const;
					return {
						kind: "exercise",
						exercise: exercise.id,
						sets: item.sets,
						range,
						restS: item.restS,
					};
				})
				.filter((item): item is ProgramItem => item !== null),
		}))
		.filter((session) => session.items.length > 0);
	const order = draft.order
		.map((index) => sessions[index]?.key)
		.filter((key): key is string => key !== undefined);
	const program: ProgramDef = {
		id: newId(),
		title: draft.title,
		goal: request.goal.slice(0, 120),
		summary: draft.summary,
		kind: "strength",
		weeks: draft.weeks,
		level: request.level,
		sports: [...new Set(sessions.map((session) => session.sport))],
		equipment: request.equipment,
		photo: "",
		sessions,
		schedule: order.length > 0 ? { [order.length]: order } : {},
		deloadEvery: draft.weeks >= 6 ? 4 : null,
		testWeeks: false,
		source: "ai",
		createdAt: now.toISOString(),
	};
	const used = new Set(sessions.flatMap((session) => session.items.map((item) => item.exercise)));
	return { program, exercises: [...created.values()].filter((item) => used.has(item.id)) };
}
