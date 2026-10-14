/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { cardStats, memberLabel, newMemberNumber, parseMember, sinceLabel } from "./member-card";

describe("member card", () => {
	test("shows body stats in the chosen units", () => {
		expect(cardStats({ heightCm: 175, weightKg: 72, heightUnit: "cm", weightUnit: "kg" })).toEqual({
			height: { value: "175", unit: "cm" },
			weight: { value: "72", unit: "kg" },
			bmi: "23.5",
			band: "healthy",
		});
		const imperial = cardStats({ heightCm: 175, weightKg: 72, heightUnit: "ft", weightUnit: "lb" });
		expect(imperial.height).toEqual({ value: "5′9″" });
		expect(imperial.weight).toEqual({ value: "159", unit: "lb" });
	});

	test("numbers are four digits", () => {
		expect(newMemberNumber(0)).toBe(1000);
		expect(newMemberNumber(0.99999)).toBe(9999);
		expect(memberLabel({ number: 4821, since: "" })).toBe("OS · 4821");
	});

	test("since shows the month the card was made", () => {
		expect(sinceLabel({ number: 1000, since: new Date(2026, 9, 3).toISOString() })).toBe(
			"Member since Oct 2026",
		);
	});

	test("damaged storage reads as no card", () => {
		expect(parseMember(null)).toBeNull();
		expect(parseMember("{")).toBeNull();
		expect(parseMember('{"number":"1","since":"x"}')).toBeNull();
		expect(parseMember('{"number":1234,"since":"2026-10-01"}')).toEqual({
			number: 1234,
			since: "2026-10-01",
		});
	});
});
