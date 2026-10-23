import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CATALOG, DEMO_IDS, guideFor, videoSearchUrl } from "./exercise-guide";
import { TEMPLATES } from "./library";

const framesSource = readFileSync(join(import.meta.dir, "demo-frames.ts"), "utf8");
const demosDir = join(import.meta.dir, "../../../../assets/training/demos");

describe("exercise guides", () => {
	it("covers every exercise the fixed sessions plan, apart from team sport", () => {
		const missing = TEMPLATES.flatMap((template) => template.exercises)
			.map((exercise) => exercise.name)
			.filter((name) => name !== "Match or training" && guideFor(name) === null);
		expect(missing).toEqual([]);
	});

	it("keeps every cue short", () => {
		for (const exercise of CATALOG) {
			for (const cue of exercise.cues) expect(cue.length).toBeLessThanOrEqual(100);
		}
	});

	it("uses every demo, and every demo's frames are bundled", () => {
		const used = new Set(CATALOG.map((exercise) => exercise.demo));
		for (const id of DEMO_IDS) {
			expect(used.has(id)).toBe(true);
			const files = [...framesSource.matchAll(new RegExp(`demos/(${id}-\\d)\\.jpg`, "g"))];
			expect(files.length).toBeGreaterThan(0);
			for (const [, file] of files) expect(existsSync(join(demosDir, `${file}.jpg`))).toBe(true);
		}
	});

	it("has no guide for an unknown exercise or a team match", () => {
		expect(guideFor("Flying kick")).toBeNull();
		expect(guideFor("Match or training")).toBeNull();
	});

	it("searches for a video tutorial by name", () => {
		expect(videoSearchUrl("Pull-ups")).toBe(
			"https://www.youtube.com/results?search_query=Pull-ups%20exercise%20tutorial",
		);
	});
});
