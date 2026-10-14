/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { daysSince, leftLabel, productUsage } from "./products";

const now = new Date(2026, 9, 14, 9, 0);

describe("productUsage", () => {
	test("full on the day it was opened", () => {
		const usage = productUsage(
			{ id: "a", name: "SPF", startedAt: "2026-10-14", lastsWeeks: 8 },
			now,
		);
		expect(usage.leftPercent).toBe(100);
		expect(usage.low).toBe(false);
		expect(usage.leftLabel).toBe("About 8 weeks left");
	});

	test("low below a quarter left", () => {
		const usage = productUsage(
			{ id: "a", name: "SPF", startedAt: "2026-09-02", lastsWeeks: 8 },
			now,
		);
		expect(usage.daysLeft).toBe(14);
		expect(usage.leftPercent).toBe(25);
		expect(usage.low).toBe(false);
		const later = productUsage(
			{ id: "a", name: "SPF", startedAt: "2026-09-01", lastsWeeks: 8 },
			now,
		);
		expect(later.low).toBe(true);
		expect(later.leftLabel).toBe("About 2 weeks left");
	});

	test("never below zero", () => {
		const usage = productUsage(
			{ id: "a", name: "SPF", startedAt: "2026-01-01", lastsWeeks: 4 },
			now,
		);
		expect(usage.leftPercent).toBe(0);
		expect(usage.leftLabel).toBe("Probably empty");
	});
});

describe("labels", () => {
	test("days, weeks and months", () => {
		expect(leftLabel(1)).toBe("About 1 day left");
		expect(leftLabel(5)).toBe("About 5 days left");
		expect(leftLabel(35)).toBe("About 5 weeks left");
		expect(leftLabel(60)).toBe("About 2 months left");
	});

	test("daysSince counts calendar days", () => {
		expect(daysSince("2026-10-11", now)).toBe(3);
		expect(daysSince("2026-10-20", now)).toBe(0);
	});
});
