/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { parseWorkoutText } from "./parse-log";

describe("parseWorkoutText", () => {
	test("runs with distance and time", () => {
		expect(parseWorkoutText("ran 5k in 30 min")).toEqual({
			kind: "session",
			type: "run",
			title: "Run · 5 km",
			durationMin: 30,
			distanceKm: 5,
		});
		expect(parseWorkoutText("Run 3.2 miles 28 minutes")).toMatchObject({
			type: "run",
			distanceKm: 5.15,
			durationMin: 28,
		});
	});
	test("gym, walks, rides, hours", () => {
		expect(parseWorkoutText("45 min gym")).toMatchObject({ type: "strength", durationMin: 45 });
		expect(parseWorkoutText("walked 20 minutes")).toMatchObject({ type: "walk", durationMin: 20 });
		expect(parseWorkoutText("bike 1h 15m")).toMatchObject({ type: "cycle", durationMin: 75 });
		expect(parseWorkoutText("yoga 1.5 hours")).toMatchObject({ type: "yoga", durationMin: 90 });
		expect(parseWorkoutText("40 min")).toMatchObject({ type: "other", durationMin: 40 });
	});
	test("distance without time asks for the time", () => {
		expect(parseWorkoutText("ran 10km")).toMatchObject({ durationMin: null, distanceKm: 10 });
	});
	test("energy check-ins", () => {
		expect(parseWorkoutText("energy 70")).toEqual({ kind: "energy", level: 70 });
		expect(parseWorkoutText("Energy: 35")).toEqual({ kind: "energy", level: 35 });
		expect(parseWorkoutText("80 energy")).toEqual({ kind: "energy", level: 80 });
		expect(parseWorkoutText("energy 140")).toBeNull();
	});
	test("unknown text", () => {
		expect(parseWorkoutText("how am I doing?")).toBeNull();
		expect(parseWorkoutText("gym")).toBeNull();
		expect(parseWorkoutText("")).toBeNull();
	});
});
