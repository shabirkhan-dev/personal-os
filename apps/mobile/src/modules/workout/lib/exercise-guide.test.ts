import { describe, expect, it } from "bun:test";
import {
	allExercises,
	guideFor,
	parseSavedExercise,
	setCustomExercises,
	videoSearchUrl,
} from "./exercise-guide";

describe("the person's exercises", () => {
	it("ship with none", () => {
		setCustomExercises([]);
		expect(allExercises()).toEqual([]);
		expect(guideFor("Push-ups")).toBeNull();
	});

	it("reads a saved or imported exercise, keeping cues short and dropping bad media", () => {
		const exercise = parseSavedExercise({
			id: "ring-row",
			name: "Ring row",
			pattern: "row",
			unit: "reps",
			level: 40,
			equipment: ["rings", "spaceship"],
			cues: ["Body straight", "x".repeat(150)],
			media: { image: "http://not-https.example/a.jpg", video: "https://example.com/v.mp4" },
		});
		expect(exercise).toMatchObject({
			name: "Ring row",
			level: 10,
			equipment: ["rings"],
			custom: true,
		});
		expect(exercise?.cues[1]?.length).toBe(100);
		expect(exercise?.media).toBeUndefined();
		expect(parseSavedExercise({ id: "x", name: "" })).toBeNull();
	});

	it("finds an exercise's guide by name once it's added", () => {
		const exercise = parseSavedExercise({ id: "a", name: "Pike push-ups", cues: ["Hips high"] });
		if (!exercise) throw new Error("no exercise");
		setCustomExercises([exercise]);
		expect(guideFor("Pike push-ups")?.cues[0]).toBe("Hips high");
		expect(guideFor("Flying kick")).toBeNull();
	});

	it("searches for a video tutorial by name", () => {
		expect(videoSearchUrl("Pull-ups")).toBe(
			"https://www.youtube.com/results?search_query=Pull-ups%20exercise%20tutorial",
		);
	});
});
