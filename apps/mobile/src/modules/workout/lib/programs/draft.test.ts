import { describe, expect, it } from "bun:test";
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

describe("AI drafts", () => {
	it("only offers exercises the equipment allows", () => {
		const ids = draftCatalog([]).map((item) => item.id);
		expect(ids).toContain("push-up");
		expect(ids).not.toContain("pull-up");
		expect(ids).not.toContain("team-match");
	});

	it("turns chained exercises into chain items and keeps the week order", () => {
		const program = programFromDraft(
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
							{ exercise: "shoulder-warm-up", sets: 1, range: [5, 5], restS: 0 },
							{ exercise: "pull-up", sets: 4, range: [4, 8], restS: 120 },
							{ exercise: "plank", sets: 3, range: [30, 45], restS: 45 },
							{ exercise: "unknown", sets: 3, range: [8, 12], restS: 60 },
						],
					},
					{
						title: "Run",
						sport: "running",
						focus: "run",
						minutes: 30,
						items: [{ exercise: "easy-run", sets: 1, range: [25, 30], restS: 0 }],
					},
				],
				order: [0, 1, 0],
			},
			request,
		);
		const [pull] = program.sessions;
		expect(pull?.items.map((item) => item.kind)).toEqual(["exercise", "chain", "chain"]);
		expect(pull?.items[2]).toMatchObject({ chain: "core", hold: [30, 45] });
		expect(program.schedule[3]).toEqual(["s1", "s2", "s1"]);
		expect(program.source).toBe("ai");
		expect(parseProgram(JSON.parse(JSON.stringify(program)))?.sessions.length).toBe(2);
	});
});
