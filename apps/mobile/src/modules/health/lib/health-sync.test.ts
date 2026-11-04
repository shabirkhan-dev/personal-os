/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import {
	changed,
	fromHealthConnect,
	fromHealthKit,
	pairBloodPressure,
	sleepReadings,
	stepsReading,
} from "./health-sync-map";

const at = "2026-11-04T07:30:00.000Z";

describe("health store records", () => {
	test("maps Health Connect records with stable ids", () => {
		expect(
			fromHealthConnect("BloodPressure", {
				time: at,
				metadata: { id: "abc" },
				systolic: { inMillimetersOfMercury: 128.4 },
				diastolic: { inMillimetersOfMercury: 83.6 },
			}),
		).toMatchObject({
			id: "hc:abc",
			kind: "bp",
			value: 128.4,
			value2: 84,
			source: "health-connect",
		});
		expect(
			fromHealthConnect("BloodGlucose", {
				time: at,
				metadata: { id: "g" },
				level: { inMilligramsPerDeciliter: 96 },
				relationToMeal: 2,
			}),
		).toMatchObject({ kind: "blood-sugar", context: "fasting" });
		expect(
			fromHealthConnect("OxygenSaturation", {
				time: at,
				metadata: { id: "o" },
				percentage: 97,
			})?.value,
		).toBe(97);
		expect(
			fromHealthConnect("OxygenSaturation", {
				time: at,
				metadata: { id: "o" },
				percentage: 140,
			}),
		).toBeNull();
		expect(fromHealthConnect("Nutrition", { time: at, metadata: { id: "n" } })).toBeNull();
	});

	test("keeps one steps and one sleep reading per day, overlaps counted once", () => {
		expect(stepsReading("health-connect", "2026-11-04", 8432.6)).toMatchObject({
			id: "hc:steps:2026-11-04",
			value: 8433,
		});
		const nights = sleepReadings("health-connect", [
			{ start: "2026-11-03T22:00:00.000Z", end: "2026-11-04T04:00:00.000Z" },
			{ start: "2026-11-04T03:00:00.000Z", end: "2026-11-04T05:30:00.000Z" },
		]);
		expect(nights).toHaveLength(1);
		expect(nights[0]).toMatchObject({ kind: "sleep", value: 450 });
	});

	test("pairs Apple Health blood pressure and turns oxygen into a percentage", () => {
		const bp = pairBloodPressure(
			[{ id: "s1", at, value: 121 }],
			[{ id: "d1", at: "2026-11-04T07:30:20.000Z", value: 79 }],
		);
		expect(bp[0]).toMatchObject({ id: "hk:s1", value: 121, value2: 79, source: "healthkit" });
		expect(fromHealthKit("spo2", { id: "x", at, value: 0.96 })?.value).toBe(96);
	});

	test("writes only new or changed readings", () => {
		const old = stepsReading("health-connect", "2026-11-04", 4000);
		const newer = stepsReading("health-connect", "2026-11-04", 6000);
		const same = stepsReading("health-connect", "2026-11-03", 9000);
		if (!old || !newer || !same) throw new Error("bad fixture");
		expect(changed([newer, same], [old, same]).map((item) => item.value)).toEqual([6000]);
	});
});
