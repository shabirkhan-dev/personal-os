import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DEMO_IDS, guideFor } from "./exercise-guide";
import { TEMPLATES } from "./library";

const framesSource = readFileSync(join(import.meta.dir, "demo-frames.ts"), "utf8");
const demosDir = join(import.meta.dir, "../../../../assets/training/demos");

/** Sport blocks are done with the team or on the road; they have no how-to. */
const sportBlock = (name: string) =>
	["Easy run", "Long run", "Rounds", "Match or training"].includes(name);

describe("exercise guides", () => {
	it("covers every exercise Training plans, apart from sport blocks", () => {
		const missing = TEMPLATES.flatMap((template) => template.exercises)
			.map((exercise) => exercise.name)
			.filter((name) => !sportBlock(name) && guideFor(name) === null);
		expect(missing).toEqual([]);
	});

	it("gives each guide three short cues", () => {
		for (const exercise of TEMPLATES.flatMap((template) => template.exercises)) {
			const guide = guideFor(exercise.name);
			if (!guide) continue;
			expect(guide.cues.length).toBe(3);
			for (const cue of guide.cues) expect(cue.length).toBeLessThanOrEqual(100);
		}
	});

	it("uses every demo, and every demo's frames are bundled", () => {
		const used = new Set(
			TEMPLATES.flatMap((template) => template.exercises).map(
				(exercise) => guideFor(exercise.name)?.demo,
			),
		);
		for (const id of DEMO_IDS) {
			expect(used.has(id)).toBe(true);
			const files = [...framesSource.matchAll(new RegExp(`demos/(${id}-\\d)\\.jpg`, "g"))];
			expect(files.length).toBeGreaterThan(0);
			for (const [, file] of files) expect(existsSync(join(demosDir, `${file}.jpg`))).toBe(true);
		}
	});

	it("has no guide for an unknown exercise", () => {
		expect(guideFor("Bench press")).toBeNull();
	});
});
