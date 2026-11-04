/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { healthNotes } from "./health-insights";
import { parseHealthLine } from "./parse-health-line";

describe("health lines", () => {
	test("reads blood pressure in the usual ways", () => {
		expect(parseHealthLine("bp 120/80")).toMatchObject({ reading: "bp", value: 120, value2: 80 });
		expect(parseHealthLine("blood pressure 135 over 88")).toMatchObject({ value: 135, value2: 88 });
		expect(parseHealthLine("118/76")).toMatchObject({ reading: "bp" });
		expect(parseHealthLine("bp 80/120")).toBeNull();
	});

	test("reads sugar with its context, and the other vitals", () => {
		expect(parseHealthLine("sugar 95 fasting")).toMatchObject({
			reading: "blood-sugar",
			value: 95,
			context: "fasting",
		});
		expect(parseHealthLine("glucose 160 after lunch")).toMatchObject({ context: "after-meal" });
		expect(parseHealthLine("spo2 97")).toMatchObject({ reading: "spo2", value: 97 });
		expect(parseHealthLine("temp 100.4")).toMatchObject({ reading: "temperature", value: 38 });
		expect(parseHealthLine("resting heart rate 58")).toMatchObject({
			reading: "resting-hr",
			value: 58,
		});
		expect(parseHealthLine("pulse 72")).toMatchObject({ reading: "heart-rate" });
		expect(parseHealthLine("weight 72.5")).toMatchObject({ reading: "weight", value: 72.5 });
		expect(parseHealthLine("8500 steps")).toMatchObject({ reading: "steps", value: 8500 });
		expect(parseHealthLine("spo2 140")).toBeNull();
	});

	test("reads doses and symptoms, and leaves other lines alone", () => {
		expect(parseHealthLine("took metformin")).toEqual({ kind: "took", medicine: "metformin" });
		expect(parseHealthLine("took my vitamin d tablet")).toEqual({
			kind: "took",
			medicine: "vitamin d",
		});
		expect(parseHealthLine("had lunch")).toBeNull();
		expect(parseHealthLine("bad headache")).toEqual({
			kind: "symptom",
			symptom: "headache",
			severity: 3,
		});
		expect(parseHealthLine("feeling a bit dizzy")).toMatchObject({ symptom: "dizzy", severity: 1 });
		expect(parseHealthLine("what should I eat")).toBeNull();
	});
});

const reading = (days: number, value: number, value2: number) => ({
	id: `bp${days}`,
	kind: "bp" as const,
	value,
	value2,
	at: new Date(2026, 10, 4 - days, 8).toISOString(),
	source: "manual" as const,
	context: null,
	note: "",
});

describe("health insights", () => {
	const now = new Date(2026, 10, 4, 9, 0);

	test("points out high blood pressure, overdue checkups, refills and lab results", () => {
		const notes = healthNotes({
			readings: [reading(1, 142, 92), reading(2, 138, 90), reading(3, 145, 94)],
			symptoms: [],
			checkups: [
				{
					id: "d",
					kind: "dentist",
					title: "Dentist",
					on: "2026-01-02",
					done: true,
					repeatMonths: 6,
					note: "",
				},
			],
			medicines: [
				{
					id: "m",
					name: "Amlodipine",
					dose: "5 mg",
					times: [480],
					stock: 3,
					active: true,
					startedOn: "2026-01-01",
					note: "",
				},
			],
			labs: [
				{
					id: "l",
					test: "Vitamin D",
					value: 18,
					unit: "ng/mL",
					low: 30,
					high: 100,
					on: "2026-10-01",
				},
			],
			now,
		});
		expect(notes.map((note) => note.kind)).toEqual(["bp-high", "overdue", "refill", "lab"]);
	});

	test("says nothing with too little to go on", () => {
		const notes = healthNotes({
			readings: [reading(1, 150, 95)],
			symptoms: [],
			checkups: [],
			medicines: [],
			labs: [],
			now,
		});
		expect(notes).toEqual([]);
	});
});
