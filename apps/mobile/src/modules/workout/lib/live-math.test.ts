import { describe, expect, it } from "bun:test";
import type { Exercise } from "./library";
import { logsSets, secondsLeft, timedSeconds, togglePause } from "./live-math";

const exercise = (overrides: Partial<Exercise>): Exercise => ({
	name: "Plank",
	photo: "push-ups",
	sets: 3,
	target: 45,
	unit: "s",
	restS: 45,
	note: "Core finisher",
	...overrides,
});

type Pausable = { pausedAtMs: number | null; pausedMs: number; restUntilMs: number | null };

describe("togglePause", () => {
	const running: Pausable = { pausedAtMs: null, pausedMs: 1_000, restUntilMs: 50_000 };

	it("pauses at the current time", () => {
		expect(togglePause(running, 20_000)).toEqual({ ...running, pausedAtMs: 20_000 });
	});

	it("resumes, adding the pause and pushing the rest timer back by it", () => {
		const paused: Pausable = { ...running, pausedAtMs: 20_000 };
		expect(togglePause(paused, 35_000)).toEqual({
			pausedAtMs: null,
			pausedMs: 16_000,
			restUntilMs: 65_000,
		});
	});

	it("leaves a missing rest timer alone", () => {
		const paused: Pausable = { pausedAtMs: 10_000, pausedMs: 0, restUntilMs: null };
		expect(togglePause(paused, 12_000).restUntilMs).toBeNull();
	});
});

describe("timed blocks", () => {
	it("times a hold for the seconds aimed at and a block for its minutes", () => {
		expect(timedSeconds(exercise({}), 40)).toBe(40);
		expect(timedSeconds(exercise({ unit: "min", target: 5 }), 5)).toBe(300);
		expect(timedSeconds(exercise({ unit: "reps", target: 8 }), 8)).toBeNull();
	});

	it("counts down in whole seconds and stops at zero", () => {
		expect(secondsLeft(0, 30, 0)).toBe(30);
		expect(secondsLeft(0, 30, 29_100)).toBe(1);
		expect(secondsLeft(0, 30, 31_000)).toBe(0);
	});

	it("logs sets for reps and holds but not for timed blocks", () => {
		expect(logsSets(exercise({}))).toBe(true);
		expect(logsSets(exercise({ unit: "reps" }))).toBe(true);
		expect(logsSets(exercise({ unit: "min" }))).toBe(false);
	});
});
