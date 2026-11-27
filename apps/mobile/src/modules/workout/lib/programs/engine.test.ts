import { beforeAll, describe, expect, it } from "bun:test";
import { type CatalogExercise, setCustomExercises } from "../exercise-guide";
import type { Exercise } from "../library";
import {
	buildProgramWeek,
	estimateMinutes,
	fitToMinutes,
	materialize,
	nextProgress,
	parseTemplateId,
	type ProgramContext,
	programStart,
	progressAfter,
	resolveTemplate,
	sessionOrder,
	substitute,
	templateId,
	weekKind,
	weekNumber,
} from "./engine";
import { parseProgram, type ProgramDef, type ProgramItem } from "./program-model";

/** The person's own exercises: no library ships with the app. */
const own = (
	id: string,
	name: string,
	pattern: CatalogExercise["pattern"],
	unit: CatalogExercise["unit"] = "reps",
	equipment: CatalogExercise["equipment"] = [],
	level = 3,
): CatalogExercise => ({
	id,
	name,
	pattern,
	level,
	equipment,
	unit,
	photo: "",
	cues: ["", "", ""],
	custom: true,
});

const EXERCISES = [
	own("push-up", "Push-ups", "push"),
	own("pike", "Pike push-ups", "push", "reps", [], 4),
	own("pull-up", "Pull-ups", "pull", "reps", ["pull-up-bar"], 5),
	own("row", "Australian rows", "pull", "reps", [], 2),
	own("plank", "Plank", "core", "s"),
	own("squat", "Squats", "squat"),
	own("easy-run", "Easy run", "run", "min"),
];

const item = (exercise: string, sets: number, range: [number, number], restS = 90, grow?: number) =>
	({ kind: "exercise", exercise, sets, range, restS, ...(grow ? { grow } : {}) }) as ProgramItem;

const HYBRID: ProgramDef = {
	id: "my-hybrid",
	title: "My hybrid",
	goal: "Strong and fit",
	summary: "",
	kind: "hybrid",
	weeks: 8,
	level: "intermediate",
	sports: ["calisthenics", "running"],
	equipment: ["pull-up-bar"],
	photo: "",
	sessions: [
		{
			key: "push",
			title: "Push",
			sport: "calisthenics",
			focus: "upper",
			minutes: 45,
			effort: 7,
			items: [item("push-up", 4, [8, 12]), item("pike", 3, [6, 10])],
		},
		{
			key: "pull",
			title: "Pull",
			sport: "calisthenics",
			focus: "upper",
			minutes: 45,
			effort: 7,
			items: [item("pull-up", 4, [5, 8]), item("plank", 3, [20, 40], 60)],
		},
		{
			key: "legs",
			title: "Legs",
			sport: "calisthenics",
			focus: "lower",
			minutes: 40,
			effort: 6,
			items: [item("squat", 4, [12, 20])],
		},
		{
			key: "easy-run",
			title: "Easy run",
			sport: "running",
			focus: "run",
			minutes: 25,
			effort: 4,
			items: [item("easy-run", 1, [25, 45], 0, 0.08)],
		},
	],
	schedule: {
		4: ["pull", "easy-run", "push", "legs"],
		6: ["pull", "easy-run", "push", "legs", "push", "easy-run"],
	},
	deloadEvery: 4,
	testWeeks: true,
	source: "custom",
	createdAt: null,
};

const settings: ProgramContext["settings"] = {
	equipment: ["pull-up-bar"],
	minutes: 45,
	daysPerWeek: 5,
	fixedDays: [],
	sports: ["calisthenics", "running"],
};
const ctx = (overrides: Partial<ProgramContext> = {}): ProgramContext => ({
	programs: [HYBRID],
	progress: new Map(),
	settings,
	...overrides,
});
const week = [
	"2026-10-19",
	"2026-10-20",
	"2026-10-21",
	"2026-10-22",
	"2026-10-23",
	"2026-10-24",
	"2026-10-25",
];

beforeAll(() => setCustomExercises(EXERCISES));

describe("a program of the person's own exercises", () => {
	it("turns every session of every week into something to train", () => {
		for (let number = 1; number <= HYBRID.weeks; number += 1) {
			for (const session of HYBRID.sessions) {
				const template = materialize(HYBRID, session.key, number, ctx());
				expect(template?.exercises.length ?? 0).toBeGreaterThan(0);
				expect(template?.minutes ?? 0).toBeGreaterThan(0);
			}
		}
	});
});

const run = (number: number) => materialize(HYBRID, "easy-run", number, ctx())?.exercises[0];

describe("weeks", () => {
	it("numbers weeks from the Monday the program started", () => {
		expect(weekNumber("2026-10-21", "2026-10-19")).toBe(1);
		expect(weekNumber("2026-10-21", "2026-10-26")).toBe(2);
		expect(weekNumber("2026-10-19", "2026-11-15")).toBe(4);
	});

	it("starts this Monday early in the week, next Monday from Thursday", () => {
		expect(programStart("2026-10-21")).toBe("2026-10-19");
		expect(programStart("2026-10-22")).toBe("2026-10-26");
		expect(programStart("2026-10-25")).toBe("2026-10-26");
	});

	it("tests in the first and last week and goes light every fourth", () => {
		expect([1, 2, 3, 4, 5, 8].map((number) => weekKind(HYBRID, number))).toEqual([
			"test",
			"build",
			"build",
			"deload",
			"build",
			"test",
		]);
	});

	it("takes the schedule for the days a week, or the nearest one", () => {
		expect(sessionOrder(HYBRID, 4)).toEqual(["pull", "easy-run", "push", "legs"]);
		expect(sessionOrder(HYBRID, 7)).toHaveLength(6);
	});

	it("keeps team days and never puts legs the day before a match", () => {
		const slots = buildProgramWeek(
			HYBRID,
			{ ...settings, fixedDays: [{ weekday: 5, activity: "sport:football" }] },
			2,
			week,
		);
		expect(slots[5]?.template).toBe("a:sport:football");
		expect(resolveTemplate("a:sport:football", ctx())?.title).toBe("Football");
		expect(slots[4]?.template).not.toBe(templateId(HYBRID.id, 2, "legs"));
	});

	it("round-trips generated ids", () => {
		expect(parseTemplateId(templateId("my-hybrid", 3, "push"))).toEqual({
			programId: "my-hybrid",
			week: 3,
			key: "push",
		});
		expect(parseTemplateId("push-handstand")).toBeNull();
	});
});

describe("exercise choice", () => {
	it("swaps an exercise someone can't do for one from the same pattern", () => {
		const pull = EXERCISES.find((exercise) => exercise.id === "pull-up");
		expect(pull && substitute(pull, [])?.name).toBe("Australian rows");
		expect(pull && substitute(pull, ["pull-up-bar"])?.name).toBe("Pull-ups");
	});

	it("uses the saved target", () => {
		const progress = new Map([
			["pull-up", { id: "pull-up", step: 0, target: 6, kg: null, misses: 0, updatedAt: "" }],
		]);
		const template = resolveTemplate(templateId(HYBRID.id, 2, "pull"), ctx({ progress }));
		const pull = template?.exercises.find((exercise) => exercise.name === "Pull-ups");
		expect(pull?.target).toBe(6);
	});

	it("makes a test week one all-out set", () => {
		const push = materialize(HYBRID, "push", 1, ctx())?.exercises.find(
			(exercise) => exercise.name === "Push-ups",
		);
		expect(push?.sets).toBe(1);
		expect(push?.target).toBeNull();
	});

	it("grows runs each week and eases off in a light week", () => {
		const second = run(2)?.target ?? 0;
		expect(run(3)?.target ?? 0).toBeGreaterThan(second);
		expect(run(4)?.target ?? 0).toBeLessThan(run(3)?.target ?? 0);
	});
});

const exercise = (name: string, sets: number, target: number): Exercise => ({
	name,
	photo: "",
	sets,
	target,
	unit: "reps",
	restS: 90,
	note: "",
});

describe("session length", () => {
	const long = [
		exercise("Push-ups", 4, 12),
		exercise("Pull-ups", 4, 8),
		exercise("Dips", 4, 10),
		exercise("Plank", 4, 10),
		exercise("Bodyweight squats", 4, 15),
	];

	it("drops the last exercises first to fit", () => {
		const fitted = fitToMinutes(long, 20);
		expect(fitted.length).toBeLessThan(long.length);
		expect(fitted[0]?.name).toBe("Push-ups");
		expect(estimateMinutes(fitted)).toBeLessThanOrEqual(25);
	});
});

describe("progression", () => {
	const ref = { key: "push-up", step: 0, range: [8, 12] as const, chainLength: 1 };
	const step = (overrides: Partial<Parameters<typeof nextProgress>[0]>) =>
		nextProgress({
			current: null,
			ref,
			planned: { sets: 3, target: 10 },
			values: [10, 10, 10],
			kg: null,
			feel: "good",
			test: false,
			weighted: false,
			now: "2026-10-24T10:00:00.000Z",
			...overrides,
		});

	it("adds a rep when every set hits the target, two after an easy one, none after a hard one", () => {
		expect(step({})?.target).toBe(11);
		expect(step({ feel: "easy" })?.target).toBe(12);
		expect(step({ feel: "hard" })?.target).toBe(10);
	});

	it("holds at the top of the range", () => {
		expect(step({ planned: { sets: 3, target: 12 }, values: [12, 12, 12] })).toMatchObject({
			step: 0,
			target: 12,
		});
	});

	it("adds 2.5 kg to a weighted lift instead", () => {
		expect(
			step({ planned: { sets: 3, target: 12 }, values: [12, 12, 12], kg: 60, weighted: true }),
		).toMatchObject({ target: 8, kg: 62.5 });
	});

	it("counts sessions below the range", () => {
		const first = step({ values: [5, 4, 4] });
		expect(first).toMatchObject({ step: 0, misses: 1 });
	});

	it("sets the target from a test", () => {
		expect(step({ test: true, values: [14] })?.target).toBe(10);
	});

	it("reads a finished session's sets into new targets", () => {
		const template = materialize(HYBRID, "push", 2, ctx());
		const push = template?.exercises.find((entry) => entry.name === "Push-ups");
		if (!template || !push) throw new Error("no push exercise");
		const sets = Array.from({ length: push.sets }, () => ({
			exercise: push.name,
			value: push.target ?? 0,
			unit: "reps" as const,
		}));
		const updates = progressAfter(template, sets, "good", new Map(), "2026-10-24T10:00:00.000Z");
		expect(updates.find((entry) => entry.id === "push-up")?.target).toBe((push.target ?? 0) + 1);
	});
});

describe("programs from storage or a template file", () => {
	it("parse back the same shape and drop exercises the person doesn't have", () => {
		const raw = JSON.parse(JSON.stringify(HYBRID));
		raw.sessions[0].items.push({ kind: "exercise", exercise: "flying-kick", sets: 3 });
		raw.sessions[0].items.push({ kind: "chain", chain: "push", sets: 3 });
		const parsed = parseProgram(raw);
		expect(parsed?.sessions.length).toBe(HYBRID.sessions.length);
		expect(parsed?.sessions[0]?.items.length).toBe(HYBRID.sessions[0]?.items.length);
		expect(parsed?.schedule[4]).toEqual(HYBRID.schedule[4]);
	});
});
