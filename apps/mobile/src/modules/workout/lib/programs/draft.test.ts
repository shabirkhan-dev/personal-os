import { beforeAll, describe, expect, it } from "bun:test";
import { parseSavedExercise, setCustomExercises } from "../exercise-guide";
import { draftCatalog, programFromDraft } from "./draft";
import { parseProgram } from "./program-model";

const request = {
	goal: "First muscle-up",
	level: "intermediate" as const,
	weeks: 8,
	daysPerWeek: 3,
	minutes: 45,
	sports: ["calisthenics" as const],
	equipment: ["pull-up-bar" as const],
};

const own = (id: string, name: string, extra: Record<string, unknown> = {}) => {
	const exercise = parseSavedExercise({ id, name, pattern: "push", unit: "reps", ...extra });
	if (!exercise) throw new Error(`bad fixture ${id}`);
	return exercise;
};

beforeAll(() =>
	setCustomExercises([
		own("push-up", "Push-ups"),
		own("pull-up", "Pull-ups", { pattern: "pull", equipment: ["pull-up-bar"] }),
		own("team", "Team match", { pattern: "sport" }),
	]),
);

describe("AI drafts", () => {
	it("only offers the person's exercises the equipment allows", () => {
		const ids = draftCatalog([]).map((item) => item.id);
		expect(ids).toEqual(["push-up"]);
		expect(draftCatalog(["pull-up-bar"]).map((item) => item.id)).toContain("pull-up");
	});

	it("uses the person's exercises and the new ones the draft defines, in the week order", () => {
		const { program, exercises } = programFromDraft(
			{
				title: "Muscle-up block",
				summary: "Pull and dip strength.",
				weeks: 8,
				sessions: [
					{
						title: "Pull",
						sport: "calisthenics",
						focus: "upper",
						minutes: 45,
						items: [
							{ exercise: "pull-up", sets: 4, range: [4, 8], restS: 120 },
							{ exercise: "straight-bar-dip", sets: 3, range: [5, 8], restS: 90 },
							{ exercise: "unknown", sets: 3, range: [8, 12], restS: 60 },
						],
					},
					{
						title: "Push",
						sport: "calisthenics",
						focus: "upper",
						minutes: 30,
						items: [{ exercise: "push-up", sets: 3, range: [10, 15], restS: 60 }],
					},
				],
				order: [0, 1, 0],
				exercises: [
					{
						key: "straight-bar-dip",
						name: "Straight bar dip",
						pattern: "dip",
						unit: "reps",
						level: 6,
						equipment: ["pull-up-bar"],
						each: false,
						weighted: false,
						cues: ["Lean over the bar", "Elbows back", "Lock out on top"],
					},
				],
			},
			request,
		);
		expect(exercises.map((exercise) => exercise.name)).toEqual(["Straight bar dip"]);
		const [pull] = program.sessions;
		expect(pull?.items.map((item) => item.exercise)).toEqual(["pull-up", exercises[0]?.id]);
		expect(program.schedule[3]).toEqual(["s1", "s2", "s1"]);
		expect(program.source).toBe("ai");
		setCustomExercises([own("push-up", "Push-ups"), own("pull-up", "Pull-ups"), ...exercises]);
		expect(parseProgram(JSON.parse(JSON.stringify(program)))?.sessions.length).toBe(2);
	});
});
