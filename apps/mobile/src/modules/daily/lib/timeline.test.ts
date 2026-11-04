/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import type { CalendarItem } from "@/modules/calendar/lib/calendar-model";
import type { AgendaItem } from "./daily-math";
import { splitAtNow, todayTimeline } from "./timeline";

const today = "2026-10-15";

const block = (id: string, minutes: number, done = false): AgendaItem => ({
	id,
	minutes,
	length: 20,
	title: id,
	detail: "",
	module: "food",
	done,
});

const item = (partial: Partial<CalendarItem> & { id: string }): CalendarItem => ({
	source: "personal",
	date: today,
	title: partial.id,
	detail: "",
	tone: "statusViolet",
	link: { kind: "event", id: partial.id },
	...partial,
});

describe("today timeline", () => {
	test("adds bills and personal events, not training or interviews, in time order", () => {
		const timeline = todayTimeline(
			[block("lunch", 13 * 60), block("breakfast", 8 * 60)],
			[
				item({ id: "dentist", minutes: 11 * 60 }),
				item({
					id: "rent",
					source: "finance",
					tone: "statusCaution",
					link: { kind: "finance-bills" },
				}),
				item({ id: "gym", source: "training", minutes: 18 * 60 }),
				item({ id: "interview", source: "career", minutes: 15 * 60 }),
				item({ id: "tomorrow", minutes: 9 * 60, date: "2026-10-16" }),
			],
			today,
		);
		expect(timeline.map((row) => row.title)).toEqual(["rent", "breakfast", "dentist", "lunch"]);
		expect(timeline[0]).toMatchObject({ allDay: true, module: "finance" });
		expect(timeline[2]).toMatchObject({ module: "daily-life", link: { kind: "event" } });
	});

	test("splits at now: ended or done is earlier, all-day waits until done", () => {
		const timeline = todayTimeline(
			[block("breakfast", 8 * 60), block("snack", 10 * 60, true), block("lunch", 13 * 60)],
			[item({ id: "birthday" })],
			today,
		);
		const { earlier, ahead } = splitAtNow(timeline, 9 * 60);
		expect(earlier.map((row) => row.title)).toEqual(["breakfast", "snack"]);
		expect(ahead.map((row) => row.title)).toEqual(["birthday", "lunch"]);
	});
});
