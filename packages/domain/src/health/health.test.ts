/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import {
	adherence,
	baseline,
	bpBand,
	daily,
	daysLeft,
	doseId,
	dosesOn,
	dueCheckups,
	labStatus,
	readiness,
	shortSleepLink,
	sugarBand,
} from "./math";
import {
	type Checkup,
	type Medicine,
	parseCheckup,
	parseHealthProfile,
	parseHealthRecord,
	parseMedicine,
	parseReading,
	type Reading,
	type Symptom,
} from "./model";

const now = new Date(2026, 10, 4, 9, 0);
const when = (day: string, hour: number) => new Date(`${day}T${hour}:00:00`).toISOString();
const at = (daysAgo: number, hour = 8) => new Date(2026, 10, 4 - daysAgo, hour).toISOString();

describe("health model", () => {
	test("keeps believable readings and drops the rest", () => {
		expect(parseReading({ id: "a", kind: "bp", value: 122, value2: 81, at: at(0) })?.value2).toBe(
			81,
		);
		expect(parseReading({ id: "a", kind: "bp", value: 80, value2: 122, at: at(0) })).toBeNull();
		expect(parseReading({ id: "b", kind: "spo2", value: 140, at: at(0) })).toBeNull();
		expect(parseReading({ id: "c", kind: "nope", value: 1, at: at(0) })).toBeNull();
		const sugar = parseReading({ id: "d", kind: "blood-sugar", value: 95, at: at(0) });
		expect(sugar?.context).toBe("random");
		expect(sugar?.source).toBe("manual");
	});

	test("parses medicines, checkups and the profile defensively", () => {
		const medicine = parseMedicine({ id: "m", name: "Metformin", times: [1200, 480, 480, -5] });
		expect(medicine?.times).toEqual([480, 1200]);
		expect(medicine).toMatchObject({ active: true, type: "medicine", form: "tablet", photo: null });
		expect(parseMedicine({ id: "s", name: "Vitamin D", type: "supplement" })?.type).toBe(
			"supplement",
		);
		expect(parseHealthRecord({ id: "r", on: "2026-11-01", kind: "prescription" })?.title).toBe(
			"Prescription",
		);
		expect(parseHealthRecord({ id: "r", on: "later" })).toBeNull();
		expect(parseCheckup({ id: "c", on: "2026-12-01", kind: "dentist" })?.title).toBe("Dentist");
		expect(parseCheckup({ id: "c", on: "soon" })).toBeNull();
		const profile = parseHealthProfile({
			id: "profile",
			bloodGroup: "Z",
			allergies: ["Peanuts", ""],
		});
		expect(profile).toMatchObject({
			bloodGroup: "unknown",
			allergies: ["Peanuts"],
			stepGoal: 8_000,
		});
	});
});

describe("health math", () => {
	test("puts blood pressure and sugar in the right bands", () => {
		expect(bpBand(118, 76).label).toBe("Normal");
		expect(bpBand(125, 78).label).toBe("Elevated");
		expect(bpBand(128, 84).label).toBe("High · stage 1");
		expect(bpBand(150, 85).tone).toBe("high");
		expect(bpBand(190, 100).tone).toBe("urgent");
		expect(sugarBand(110, "fasting").label).toBe("A little high");
		expect(sugarBand(150, "after-meal").label).toBe("A little high");
		expect(sugarBand(60, "random").tone).toBe("urgent");
	});

	test("scores readiness against your own normal", () => {
		const readings: Reading[] = [1, 2, 3, 4].map((days) => ({
			id: `hr${days}`,
			kind: "resting-hr",
			value: 60,
			value2: null,
			at: at(days),
			source: "manual",
			context: null,
			note: "",
		}));
		const normal = baseline(readings, "resting-hr", now);
		expect(normal).toBe(60);
		const good = readiness({
			sleepMinutes: 480,
			restingHr: 60,
			hrv: null,
			baselineHr: normal,
			baselineHrv: null,
		});
		expect(good?.label).toBe("Ready");
		const poor = readiness({
			sleepMinutes: 300,
			restingHr: 67,
			hrv: null,
			baselineHr: normal,
			baselineHrv: null,
		});
		expect(poor?.label).toBe("Take it easy");
		expect(poor?.reason.toLowerCase()).toContain("only 5h of sleep");
		expect(poor?.reason.toLowerCase()).toContain("resting heart rate up 7");
		expect(
			readiness({
				sleepMinutes: null,
				restingHr: null,
				hrv: null,
				baselineHr: null,
				baselineHrv: null,
			}),
		).toBeNull();
	});

	test("lists booked checkups and the next of each repeating one", () => {
		const checkups: Checkup[] = [
			{
				id: "a",
				kind: "dentist",
				title: "Dentist",
				on: "2026-05-10",
				done: true,
				repeatMonths: 6,
				note: "",
			},
			{
				id: "b",
				kind: "lab",
				title: "Blood test",
				on: "2026-11-20",
				done: false,
				repeatMonths: null,
				note: "",
			},
			{
				id: "c",
				kind: "eyes",
				title: "Eye test",
				on: "2025-01-31",
				done: true,
				repeatMonths: 12,
				note: "",
			},
		];
		const due = dueCheckups(checkups, "2026-11-04");
		expect(due.map((item) => [item.checkup.id, item.due, item.overdue])).toEqual([
			["c", "2026-01-31", true],
			["a", "2026-11-10", false],
			["b", "2026-11-20", false],
		]);
	});

	test("tracks today's doses, adherence and refills", () => {
		const metformin: Medicine = {
			id: "m",
			type: "medicine",
			name: "Metformin",
			dose: "500 mg",
			form: "tablet",
			purpose: "",
			withFood: "with",
			photo: null,
			times: [8 * 60, 20 * 60],
			stock: 9,
			active: true,
			startedOn: "2026-10-01",
			note: "",
		};
		const logs = [
			{
				id: doseId("m", "2026-11-04", 480),
				medicineId: "m",
				day: "2026-11-04",
				minutes: 480,
				status: "taken" as const,
				at: at(0),
			},
			{
				id: doseId("m", "2026-11-03", 480),
				medicineId: "m",
				day: "2026-11-03",
				minutes: 480,
				status: "taken" as const,
				at: at(1),
			},
		];
		const today = dosesOn([metformin], logs, "2026-11-04", 9 * 60, "2026-11-04");
		expect(today.map((dose) => dose.state)).toEqual(["taken", "later"]);
		expect(dosesOn([metformin], [], "2026-11-04", 11 * 60, "2026-11-04")[0]?.state).toBe("missed");
		expect(adherence([metformin], logs, now, 1)).toBe(0.5);
		expect(daysLeft(metformin)).toBe(4);
	});

	test("reads lab ranges and the link between short nights and a symptom", () => {
		expect(
			labStatus({
				id: "l",
				test: "Vitamin D",
				value: 18,
				unit: "ng/mL",
				low: 30,
				high: 100,
				on: "2026-11-01",
			}),
		).toBe("low");
		const sleep = new Map([
			["2026-11-01", 300],
			["2026-11-02", 320],
			["2026-11-03", 330],
			["2026-10-29", 480],
			["2026-10-30", 470],
			["2026-10-31", 460],
		]);
		const symptoms: Symptom[] = ["2026-11-01", "2026-11-02", "2026-10-30"].map((day) => ({
			id: day,
			kind: "headache",
			severity: 2,
			day,
			at: `${day}T10:00:00.000Z`,
			note: "",
		}));
		const link = shortSleepLink(symptoms, sleep, "headache");
		expect(link?.short).toBeCloseTo(2 / 3);
		expect(link?.rest).toBeCloseTo(1 / 3);
	});

	test("gives one value per day for a trend", () => {
		const days = daily(
			[
				{
					id: "a",
					kind: "resting-hr",
					value: 60,
					value2: null,
					at: when("2026-11-04", 10),
					source: "manual",
					context: null,
					note: "",
				},
				{
					id: "b",
					kind: "resting-hr",
					value: 64,
					value2: null,
					at: when("2026-11-04", 12),
					source: "manual",
					context: null,
					note: "",
				},
				{
					id: "c",
					kind: "resting-hr",
					value: 70,
					value2: null,
					at: when("2026-11-02", 10),
					source: "manual",
					context: null,
					note: "",
				},
			],
			"resting-hr",
			now,
			3,
		);
		expect(days).toEqual([
			{ day: "2026-11-02", value: 70 },
			{ day: "2026-11-03", value: null },
			{ day: "2026-11-04", value: 62 },
		]);
	});
});
