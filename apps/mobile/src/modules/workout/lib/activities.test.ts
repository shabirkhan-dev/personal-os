import { describe, expect, it } from "bun:test";
import { activityFor, activityTemplate, newMetric, parseActivity } from "./activities";
import {
	allExercises,
	driveFileId,
	drivePreviewUrl,
	exerciseById,
	guideFor,
	parseSavedExercise,
	setCustomExercises,
} from "./exercise-guide";

const futsal = parseActivity({
	id: "a1",
	name: "Futsal",
	kind: "football",
	minutes: 60,
	distance: false,
	metrics: [
		{ label: "Goals", unit: "" },
		{ label: "Goals", unit: "" },
		{ label: "Shots on target", unit: "" },
	],
	createdAt: "2026-10-24T10:00:00.000Z",
});

describe("activities", () => {
	it("parse with their own numbers, dropping duplicates", () => {
		expect(futsal?.metrics.map((metric) => metric.key)).toEqual(["goals", "shots-on-target"]);
		expect(parseActivity({ id: "x", name: "" })).toBeNull();
		expect(parseActivity({ id: "x", name: "Padel", kind: "padel" })?.kind).toBe("other");
	});

	it("resolve an activity day, and old team days through their preset", () => {
		if (!futsal) throw new Error("no activity");
		expect(activityFor("a:a1", [futsal])?.name).toBe("Futsal");
		expect(activityFor("a:sport:volleyball", [])?.name).toBe("Volleyball");
		expect(activityFor("a:missing", [])).toBeNull();
		const template = activityTemplate("a:a1", futsal);
		expect(template).toMatchObject({ title: "Futsal", sport: "football", minutes: 60 });
	});

	it("key a new number from its label", () => {
		expect(newMetric("Hardest grade", "")).toEqual({
			key: "hardest-grade",
			label: "Hardest grade",
			unit: "",
		});
	});
});

describe("saved exercises", () => {
	it("add their own exercises and media on built-in ones", () => {
		const own = parseSavedExercise({
			id: "u-1",
			name: "Ring muscle-up",
			pattern: "pull",
			level: 9,
			equipment: ["rings", "bogus"],
			unit: "reps",
			cues: ["False grip", "Pull to the chest", ""],
			media: { animation: "https://media.example.com/mu.gif", video: "https://example.com/v" },
		});
		const change = parseSavedExercise({
			id: "push-up",
			cues: ["", "", ""],
			media: { image: "https://media.example.com/push.jpg" },
		});
		expect(own).toMatchObject({
			custom: true,
			equipment: ["rings"],
			media: { animation: "https://media.example.com/mu.gif" },
		});
		expect(own?.media?.video).toBeUndefined();
		if (!own || !change) throw new Error("not parsed");
		setCustomExercises([own, change]);
		expect(exerciseById("u-1")?.name).toBe("Ring muscle-up");
		expect(guideFor("Push-ups")?.media?.image).toBe("https://media.example.com/push.jpg");
		expect(guideFor("Push-ups")?.cues[0]).toContain("Hands under the shoulders");
		expect(allExercises().some((exercise) => exercise.id === "u-1")).toBe(true);
		setCustomExercises([]);
		expect(exerciseById("u-1")).toBeNull();
	});
});

describe("Google Drive links", () => {
	it("find the file id in the usual share link shapes", () => {
		const id = "1AbCdEfGhIjKlMnOpQrStUvWxYz";
		expect(driveFileId(`https://drive.google.com/file/d/${id}/view?usp=sharing`)).toBe(id);
		expect(driveFileId(`https://drive.google.com/open?id=${id}`)).toBe(id);
		expect(driveFileId(`https://drive.google.com/uc?id=${id}&export=download`)).toBe(id);
		expect(driveFileId("https://youtube.com/watch?v=abc")).toBeNull();
		expect(driveFileId("not a link")).toBeNull();
		expect(drivePreviewUrl(`https://drive.google.com/file/d/${id}/view`)).toBe(
			`https://drive.google.com/file/d/${id}/preview`,
		);
	});
});
