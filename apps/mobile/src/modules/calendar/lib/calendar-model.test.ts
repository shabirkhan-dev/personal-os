import { describe, expect, it } from "bun:test";
import { BUILT_IN_PROGRAMS } from "@/modules/workout/lib/programs/built-in";
import { defaultSettings } from "@/modules/workout/lib/training-model";
import {
	billItems,
	careerItems,
	daysBetween,
	eventItems,
	itemsOn,
	monthGrid,
	parseEvent,
} from "./calendar-model";
import { trainingItems } from "./training-items";

describe("the month grid", () => {
	it("starts on Monday and covers the whole month", () => {
		const weeks = monthGrid(2026, 9); // October 2026 starts on a Thursday
		expect(weeks[0]?.[0]).toBe("2026-09-28");
		expect(weeks.flat()).toContain("2026-10-31");
		expect(weeks.every((week) => week.length === 7)).toBe(true);
		expect(weeks.at(-1)?.[6]).toBe("2026-11-01");
	});

	it("lists the days in a range", () => {
		expect(daysBetween("2026-10-30", "2026-11-02")).toEqual([
			"2026-10-30",
			"2026-10-31",
			"2026-11-01",
			"2026-11-02",
		]);
	});
});

describe("personal events", () => {
	const trip = parseEvent({
		id: "e1",
		title: "Trip",
		date: "2026-10-20",
		endDate: "2026-10-23",
		start: null,
		tone: "statusSuccess",
	});
	const physio = parseEvent({
		id: "e2",
		title: "Physio",
		date: "2026-10-21",
		start: 540,
		end: 600,
	});

	it("parse ranges and times, rejecting broken ones", () => {
		expect(trip).toMatchObject({ endDate: "2026-10-23", start: null, tone: "statusSuccess" });
		expect(physio).toMatchObject({ start: 540, end: 600, tone: "statusViolet" });
		expect(parseEvent({ id: "x", title: "", date: "2026-10-21" })).toBeNull();
		expect(
			parseEvent({ id: "x", title: "y", date: "2026-10-21", endDate: "2026-10-01" })?.endDate,
		).toBeNull();
	});

	it("show a range on every day it covers, before timed items", () => {
		if (!trip || !physio) throw new Error("not parsed");
		const items = eventItems([trip, physio], "2026-10-19", "2026-10-25");
		expect(itemsOn(items, "2026-10-22").map((item) => item.title)).toEqual(["Trip"]);
		expect(itemsOn(items, "2026-10-21").map((item) => item.title)).toEqual(["Trip", "Physio"]);
		expect(itemsOn(items, "2026-10-24")).toEqual([]);
	});
});

describe("money and career", () => {
	it("puts bills on their due day, the last day for short months, marking paid ones", () => {
		const bills = [
			{ id: "b1", name: "Rent", amount: 50000, dueDay: 31, paid: ["2026-11"], since: null },
		];
		const items = billItems(bills, "2026-10-01", "2026-11-30", (amount) => `Rs ${amount}`);
		expect(items.map((item) => [item.date, item.done])).toEqual([
			["2026-10-31", false],
			["2026-11-30", true],
		]);
	});

	it("shows interviews at their time and follow-ups, not for closed applications", () => {
		const apps = [
			{
				id: "a1",
				company: "Acme",
				role: "Frontend",
				stage: "interview",
				interview: { at: "2026-10-22T14:30:00", round: "Technical", minutes: 60 },
				followUpAt: "2026-10-25T09:00:00",
			},
			{
				id: "a2",
				company: "Old",
				role: "x",
				stage: "closed",
				interview: null,
				followUpAt: "2026-10-22T09:00:00",
			},
		];
		const items = careerItems(apps, "2026-10-19", "2026-10-25");
		expect(items.map((item) => [item.title, item.date, item.minutes])).toEqual([
			["Interview · Acme", "2026-10-22", 870],
			["Follow up · Acme", "2026-10-25", undefined],
		]);
	});
});

describe("training", () => {
	it("plans program weeks ahead and marks each week's kind", () => {
		const settings = {
			...defaultSettings(),
			setUp: true,
			program: { id: "hybrid-athlete", startedOn: "2026-10-19" },
			daysPerWeek: 4,
		};
		const items = trainingItems(
			{
				settings,
				plans: [],
				sessions: [],
				programs: BUILT_IN_PROGRAMS,
				progress: new Map(),
				activities: [],
			},
			"2026-11-09",
			"2026-11-15",
		);
		const week = items.find((item) => item.endDate);
		expect(week).toMatchObject({ title: "Hybrid Athlete · week 4", detail: "Light week" });
		expect(items.filter((item) => !item.endDate)).toHaveLength(4);
	});
});
