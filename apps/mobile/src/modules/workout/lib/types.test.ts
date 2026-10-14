/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { activeElapsedMs, emptyWorkoutDoc, parseWorkoutDoc } from "./types";

describe("parseWorkoutDoc", () => {
	test("bad input is an empty document", () => {
		expect(parseWorkoutDoc(null)).toEqual(emptyWorkoutDoc);
		expect(parseWorkoutDoc([1])).toEqual(emptyWorkoutDoc);
	});
	test("keeps valid entries and drops broken ones", () => {
		const doc = parseWorkoutDoc({
			sessions: [
				{
					id: "a",
					type: "run",
					title: "Run",
					startedAt: "2026-10-14T07:00:00.000Z",
					durationMin: 30,
					distanceKm: 5,
					kcal: 350,
					feel: "good",
				},
				{ id: "b", startedAt: "nope", durationMin: 30 },
				{
					id: "c",
					type: "dance",
					startedAt: "2026-10-14T07:00:00.000Z",
					durationMin: 10,
					feel: null,
				},
			],
			energy: [
				{ id: "e", at: "2026-10-14T07:00:00.000Z", level: 70 },
				{ id: "f", at: "x", level: 2 },
			],
			active: { type: "yoga", title: "Yoga", startedAtMs: 1000, pausedMs: 0, pausedAtMs: null },
		});
		expect(doc.sessions).toHaveLength(2);
		expect(doc.sessions[0]?.distanceKm).toBe(5);
		expect(doc.sessions[1]?.type).toBe("other");
		expect(doc.sessions[1]?.feel).toBeNull();
		expect(doc.energy).toHaveLength(1);
		expect(doc.active?.type).toBe("yoga");
	});
});

test("activeElapsedMs leaves out pauses", () => {
	const base = { type: "run" as const, title: "Run", startedAtMs: 1_000, pausedMs: 500 };
	expect(activeElapsedMs({ ...base, pausedAtMs: null }, 11_000)).toBe(9_500);
	expect(activeElapsedMs({ ...base, pausedAtMs: 6_000 }, 11_000)).toBe(4_500);
});
