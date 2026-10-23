import { describe, expect, it } from "bun:test";
import { CATALOG, exerciseById } from "../exercise-guide";
import type { Exercise } from "../library";
import { BUILT_IN_PROGRAMS } from "./built-in";
import {
	buildProgramWeek,
	chainsIn,
	defaultStep,
	estimateMinutes,
	fitToMinutes,
	materialize,
	nextProgress,
	parseTemplateId,
	pickRung,
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
import { CHAINS, parseProgram, type ProgramDef, type Progress } from "./program-model";

const settings: ProgramContext["settings"] = {
	equipment: ["pull-up-bar", "dip-bars"],
	minutes: 45,
	daysPerWeek: 5,
	fixedDays: [],
	sports: ["calisthenics", "running", "boxing"],
};
const ctx = (overrides: Partial<ProgramContext> = {}): ProgramContext => ({
	programs: BUILT_IN_PROGRAMS,
	progress: new Map(),
	settings,
	...overrides,
});
const hybrid = BUILT_IN_PROGRAMS[0] as ProgramDef;
const week = [
	"2026-10-19",
	"2026-10-20",
	"2026-10-21",
	"2026-10-22",
	"2026-10-23",
	"2026-10-24",
	"2026-10-25",
];

describe("the catalog and chains", () => {
	it("has unique ids and names", () => {
		expect(new Set(CATALOG.map((item) => item.id)).size).toBe(CATALOG.length);
		expect(new Set(CATALOG.map((item) => item.name)).size).toBe(CATALOG.length);
	});

	it("only chains exercises that exist, easiest first", () => {
		for (const rungs of Object.values(CHAINS)) {
			const levels = rungs.map((id) => exerciseById(id)?.level ?? -1);
			expect(levels).not.toContain(-1);
			expect([...levels].sort((a, b) => a - b)).toEqual(levels);
		}
	});
});

describe("built-in programs", () => {
	it("have unique ids, valid schedules and known exercises", () => {
		expect(new Set(BUILT_IN_PROGRAMS.map((program) => program.id)).size).toBe(
			BUILT_IN_PROGRAMS.length,
		);
		for (const program of BUILT_IN_PROGRAMS) {
			const keys = new Set(program.sessions.map((session) => session.key));
			expect(keys.size).toBe(program.sessions.length);
			for (const order of Object.values(program.schedule)) {
				for (const key of order ?? []) expect(keys.has(key)).toBe(true);
			}
			for (const item of program.sessions.flatMap((session) => session.items)) {
				if (item.kind === "exercise") expect(exerciseById(item.exercise)).not.toBeNull();
			}
		}
	});

	it("turn every session of every week into something to train", () => {
		for (const program of BUILT_IN_PROGRAMS) {
			const equipment = [...new Set([...settings.equipment, ...program.equipment])];
			for (let number = 1; number <= program.weeks; number += 1) {
				for (const session of program.sessions) {
					const template = materialize(
						program,
						session.key,
						number,
						ctx({ settings: { ...settings, equipment } }),
					);
					expect(template?.exercises.length ?? 0).toBeGreaterThan(0);
					expect(template?.minutes ?? 0).toBeGreaterThan(0);
				}
			}
		}
	});
});

const run = (number: number) => materialize(hybrid, "easy-run", number, ctx())?.exercises[0];

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
		expect([1, 2, 3, 4, 5, 8].map((number) => weekKind(hybrid, number))).toEqual([
			"test",
			"build",
			"build",
			"deload",
			"build",
			"test",
		]);
	});

	it("takes the schedule for the days a week, or the nearest one", () => {
		expect(sessionOrder(hybrid, 4)).toEqual(["pull", "easy-run", "push", "legs"]);
		expect(sessionOrder(hybrid, 7)).toHaveLength(6);
	});

	it("keeps team days and never puts legs the day before a match", () => {
		const slots = buildProgramWeek(
			hybrid,
			{ ...settings, fixedDays: [{ weekday: 5, sport: "football" }] },
			2,
			week,
		);
		expect(slots[5]?.template).toBe("football");
		expect(slots[4]?.template).not.toBe(templateId(hybrid.id, 2, "legs"));
		expect(slots.filter((slot) => slot.template?.startsWith("p:")).length).toBe(5);
	});

	it("round-trips generated ids", () => {
		expect(parseTemplateId(templateId("hybrid-athlete", 3, "push"))).toEqual({
			programId: "hybrid-athlete",
			week: 3,
			key: "push",
		});
		expect(parseTemplateId("push-handstand")).toBeNull();
	});
});

describe("exercise choice", () => {
	it("starts a chain at the program's level", () => {
		expect(exerciseById(String(CHAINS.push[defaultStep("push", "beginner")]))?.name).toBe(
			"Incline push-ups",
		);
	});

	it("steps down to a rung the equipment allows, or gives up", () => {
		expect(pickRung("dip", 1, [])?.exercise.name).toBe("Bench dips");
		expect(pickRung("pull", 3, [])).toBeNull();
	});

	it("swaps an exercise for one from the same pattern", () => {
		const rope = exerciseById("jump-rope");
		expect(rope && substitute(rope, [])?.pattern).toBe("conditioning");
	});

	it("uses the saved level and target", () => {
		const progress = new Map<string, Progress>([
			["pull", { id: "pull", step: 3, target: 6, kg: null, misses: 0, updatedAt: "" }],
		]);
		const template = resolveTemplate(templateId(hybrid.id, 2, "pull"), ctx({ progress }));
		const pull = template?.exercises.find((item) => item.progress?.key === "pull");
		expect(pull?.name).toBe("Pull-ups");
		expect(pull?.target).toBe(6);
	});

	it("makes a test week one all-out set", () => {
		const template = materialize(hybrid, "push", 1, ctx());
		const push = template?.exercises.find((item) => item.progress?.key === "push");
		expect(push?.sets).toBe(1);
		expect(push?.target).toBeNull();
	});

	it("grows runs each week and eases off in a light week", () => {
		expect(run(2)?.target).toBe(27);
		expect(run(4)?.target).toBe(22);
	});
});

const exercise = (name: string, sets: number, target: number): Exercise => ({
	name,
	photo: "push-ups",
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
	const ref = { key: "push", step: 1, range: [8, 12] as const, chainLength: 7 };
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

	it("moves up a variation past the top of the range", () => {
		expect(step({ planned: { sets: 3, target: 12 }, values: [12, 12, 12] })).toMatchObject({
			step: 2,
			target: 8,
		});
	});

	it("adds 2.5 kg to a weighted lift instead", () => {
		expect(
			step({ planned: { sets: 3, target: 12 }, values: [12, 12, 12], kg: 60, weighted: true }),
		).toMatchObject({ step: 1, target: 8, kg: 62.5 });
	});

	it("steps back after two sessions below the range", () => {
		const first = step({ values: [5, 4, 4] });
		expect(first).toMatchObject({ step: 1, misses: 1 });
		expect(step({ current: first, values: [6, 5, 4] })).toMatchObject({ step: 0, target: 12 });
	});

	it("sets the target from a test, and skips a rung when it is far too easy", () => {
		expect(step({ test: true, values: [14] })?.target).toBe(10);
		expect(step({ test: true, values: [20] })).toMatchObject({ step: 2, target: 8 });
	});

	it("reads a finished session's sets into level changes", () => {
		const template = materialize(hybrid, "push", 2, ctx());
		const push = template?.exercises.find((item) => item.progress?.key === "push");
		if (!template || !push) throw new Error("no push exercise");
		const sets = Array.from({ length: push.sets }, () => ({
			exercise: push.name,
			value: push.target ?? 0,
			unit: "reps" as const,
		}));
		const updates = progressAfter(template, sets, "good", new Map(), "2026-10-24T10:00:00.000Z");
		expect(updates.find((item) => item.id === "push")?.target).toBe((push.target ?? 0) + 1);
	});
});

describe("designed programs", () => {
	it("parse back the same shape and drop unknown exercises", () => {
		const raw = JSON.parse(JSON.stringify({ ...hybrid, id: "mine", source: "custom" }));
		raw.sessions[0].items.push({ kind: "exercise", exercise: "flying-kick", sets: 3 });
		const parsed = parseProgram(raw);
		expect(parsed?.sessions.length).toBe(hybrid.sessions.length);
		expect(parsed?.sessions[0]?.items.length).toBe(hybrid.sessions[0]?.items.length);
		expect(parsed?.schedule[4]).toEqual(hybrid.schedule[4]);
		expect(chainsIn(parsed as ProgramDef)).toContain("pull");
	});
});
