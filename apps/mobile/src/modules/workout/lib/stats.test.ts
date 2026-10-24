import { describe, expect, it } from "bun:test";
import { BUILT_IN_PROGRAMS } from "./programs/built-in";
import {
	activityTotals,
	adherence,
	adherenceShare,
	estimatedMax,
	exerciseHistory,
	readiness,
	records,
	testResults,
	volumeByPattern,
} from "./stats";
import type { Feel, Session, SetLog } from "./training-model";

const session = (day: string, overrides: Partial<Session> = {}, sets: SetLog[] = []): Session => ({
	id: `${day}-${Math.random()}`,
	template: null,
	sport: "calisthenics",
	title: "Workout",
	startedAt: `${day}T18:00:00.000Z`,
	durationMin: 45,
	distanceKm: null,
	kcal: 300,
	feel: null,
	sets,
	rounds: null,
	splits: [],
	climbM: null,
	avgHr: null,
	note: "",
	...overrides,
});
const reps = (exercise: string, ...values: number[]): SetLog[] =>
	values.map((value) => ({ exercise, value, unit: "reps" }));

describe("exercise progress", () => {
	const sessions = [
		session("2026-10-01", {}, reps("Pull-ups", 6, 5, 5)),
		session("2026-10-08", {}, reps("Pull-ups", 8, 7, 6)),
		session("2026-10-08", {}, [{ exercise: "Bench press", value: 5, unit: "reps", kg: 80 }]),
	];

	it("keeps the best set per day, oldest first", () => {
		expect(exerciseHistory(sessions, "Pull-ups").map((point) => [point.day, point.best])).toEqual([
			["2026-10-01", 6],
			["2026-10-08", 8],
		]);
	});

	it("estimates a one-rep max for weighted lifts", () => {
		expect(estimatedMax(80, 5)).toBe(93.5);
		expect(estimatedMax(100, 1)).toBe(100);
		expect(exerciseHistory(sessions, "Bench press")[0]).toMatchObject({
			unit: "kg",
			best: 80,
			max: 93.5,
		});
	});

	it("lists each exercise's best", () => {
		expect(records(sessions)).toEqual([
			{ name: "Pull-ups", best: "8 reps", day: "2026-10-08" },
			{ name: "Bench press", best: "80 kg · est. max 93.5 kg", day: "2026-10-08" },
		]);
	});

	it("counts sets per movement pattern in the last week", () => {
		expect(volumeByPattern(sessions, new Date("2026-10-09T12:00:00"))).toEqual([
			{ pattern: "Pull-ups", sets: 3 },
			{ pattern: "Gym lifts", sets: 1 },
		]);
	});
});

describe("consistency", () => {
	it("compares planned sessions with sessions done", () => {
		const plans = [
			{
				id: "2026-10-19",
				createdAt: "",
				slots: [
					{ day: "2026-10-19", template: "pull-core", movedFrom: null },
					{ day: "2026-10-21", template: "easy-run", movedFrom: null },
					{ day: "2026-10-22", template: null, movedFrom: null },
					{ day: "2026-10-25", template: "push-handstand", movedFrom: null },
				],
			},
		];
		const sessions = [session("2026-10-19", { template: "pull-core" })];
		const weeks = adherence(plans, sessions, new Date("2026-10-23T12:00:00"), 2);
		expect(weeks.at(-1)).toEqual({ monday: "2026-10-19", planned: 2, done: 1 });
		expect(adherenceShare(weeks)).toBe(0.5);
		expect(adherenceShare([])).toBeNull();
	});
});

describe("activities and tests", () => {
	it("totals an activity's sessions, minutes, distance and own numbers", () => {
		const football = {
			id: "f",
			name: "Football",
			kind: "football" as const,
			minutes: 75,
			distance: false,
			metrics: [{ key: "goals", label: "Goals", unit: "" }],
			photo: "football",
			createdAt: "",
		};
		const sessions = [
			session("2026-10-20", { activity: "f", durationMin: 80, metrics: { goals: 2 } }),
			session("2026-10-22", { activity: "f", durationMin: 70, metrics: { goals: 1 } }),
			session("2026-10-22"),
		];
		expect(activityTotals(sessions, [football], ["2026-10-20", "2026-10-22"])).toEqual([
			{
				activity: football,
				count: 2,
				minutes: 150,
				km: 0,
				metrics: [{ label: "Goals", unit: "", total: 3 }],
			},
		]);
	});

	it("finds program test sessions", () => {
		const sessions = [
			session("2026-10-19", { template: "p:hybrid-athlete:1:push" }, reps("Push-ups", 24)),
			session("2026-10-26", { template: "p:hybrid-athlete:2:push" }, reps("Push-ups", 12)),
		];
		expect(testResults(sessions, BUILT_IN_PROGRAMS)).toEqual([
			{
				day: "2026-10-19",
				program: "Hybrid Athlete",
				week: 1,
				sets: [{ exercise: "Push-ups", value: 24, unit: "reps" }],
			},
		]);
	});
});

const felt = (day: string, feel: Feel) => session(day, { feel });

describe("readiness", () => {
	const now = new Date("2026-10-24T08:00:00");

	it("is ready to push after good sleep and a rest day", () => {
		expect(
			readiness({ sleptMinutes: 8 * 60, sessions: [felt("2026-10-22", "good")], now }),
		).toMatchObject({ level: "push" });
	});

	it("says take it easy after short sleep, hard sessions and days in a row", () => {
		const sessions = ["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23"].map(
			(day) => felt(day, "hard"),
		);
		const result = readiness({ sleptMinutes: 5 * 60, sessions, now });
		expect(result.level).toBe("easy");
		expect(result.reasons).toEqual([
			"Slept 5.0 h",
			"3 of the last sessions felt hard",
			"5 days in a row",
		]);
	});
});
