import { describe, expect, it } from "bun:test";
import {
	availableMinimum,
	dailyNotes,
	draftPlan,
	freeGaps,
	keptToday,
	minimumState,
	minimumTitle,
	recap,
	rightNow,
	type Sources,
	sleepWord,
	sleptMinutes,
	streak,
	withDone,
} from "./daily-math";
import { dailyAlarms } from "./alarms";
import {
	type DayLog,
	defaultSettings,
	emptyLog,
	parseLog,
	parsePlan,
	parseSettings,
	parseSleep,
} from "./daily-model";
import { parseDailyLine, readClock } from "./parse-daily-line";

const now = new Date("2026-10-16T15:28:00"); // a Friday afternoon
const settings = { ...defaultSettings(), setUp: true };
const entry = (id: string, minutes: number, title: string, done = false, length = 10) => ({
	id,
	minutes,
	length,
	title,
	detail: `${length} min`,
	done,
});

const sources: Sources = {
	modules: ["daily-life", "faith", "career", "food", "skincare", "workout", "finance"],
	faith: {
		setUp: true,
		entries: [
			entry("faith-fajr", 340, "Fajr", true),
			entry("faith-maghrib", 1058, "Maghrib"),
			entry("faith-isha", 1140, "Isha"),
		],
		prayed: 1,
		total: 3,
		names: ["Fajr", "Maghrib", "Isha"],
	},
	career: {
		appliedToday: 1,
		dailyTarget: 2,
		entries: [],
		interviewSoon: { company: "Acme", at: "2026-10-17T10:00:00Z" },
	},
	food: {
		setUp: true,
		protein: 96,
		proteinTarget: 140,
		entries: [entry("food-dinner", 1185, "Dinner · chicken karahi", false, 20)],
	},
	care: {
		setUp: true,
		morning: { done: 4, total: 4, finished: true },
		night: { done: 0, total: 3, finished: false },
		entries: [
			entry("care-morning", 390, "Morning skin", true, 4),
			entry("care-night", 1335, "Night routine", false, 6),
		],
	},
	workout: {
		minutesToday: 0,
		plannedToday: true,
		entries: [entry("workout-today", 1110, "Push + handstand", false, 45)],
	},
};

const day = (id: string, kept: number) => ({ ...emptyLog(id), kept, total: 3 });

describe("minimum day", () => {
	it("reads each item from its module", () => {
		expect(minimumTitle("pray", sources, settings)).toBe("Pray Fajr, Maghrib, Isha");
		expect(minimumTitle("apply", sources, settings)).toBe("Send 2 applications");
		expect(minimumState("pray", sources, null)).toEqual({
			value: "1/3",
			share: 1 / 3,
			done: false,
		});
		expect(minimumState("apply", sources, null).value).toBe("1/2");
		expect(minimumState("protein", sources, null)).toMatchObject({ value: "96g", done: false });
		expect(minimumState("train", sources, null).value).toBe("18:30");
		expect(minimumState("routines", sources, null)).toMatchObject({ value: "AM ✓", share: 0.5 });
		const log: DayLog = { ...emptyLog("2026-10-16"), ticked: ["read"] };
		expect(minimumState("read", sources, log).done).toBe(true);
		expect(keptToday(["pray", "read", "routines"], sources, log)).toBe(1);
	});

	it("only offers items for modules that are on", () => {
		expect(availableMinimum({ ...sources, modules: ["daily-life", "food"] })).toEqual([
			"protein",
			"read",
			"phone",
		]);
	});

	it("never misses twice: one miss keeps the streak, two end it", () => {
		const logs = [
			day("2026-10-11", 3),
			day("2026-10-12", 3),
			day("2026-10-13", 1),
			day("2026-10-14", 3),
			day("2026-10-15", 3),
		];
		expect(streak(logs, now)).toBe(4);
		expect(streak([...logs, day("2026-10-16", 3)], now)).toBe(5);
		expect(streak([day("2026-10-13", 0), day("2026-10-14", 1), day("2026-10-15", 3)], now)).toBe(1);
	});

	it("counts a day with no log as one miss, not the end of the streak", () => {
		const kept = [day("2026-10-15", 3), day("2026-10-16", 3), day("2026-10-17", 3)];
		const monday = new Date("2026-10-19T09:00:00");
		const sunday = new Date("2026-10-18T21:00:00");
		expect(streak(kept, monday)).toBe(3);
		expect(streak([...kept, day("2026-10-18", 1)], monday)).toBe(3);
		expect(streak(kept, sunday)).toBe(3);
		expect(streak([day("2026-10-14", 3), day("2026-10-15", 3)], monday)).toBe(0);
	});
});

describe("plan", () => {
	const blocks = draftPlan(sources, settings, now);

	it("drafts the day from the modules, in order", () => {
		expect(blocks.map((block) => block.title)).toEqual([
			"Fajr and Quran",
			"Morning skin",
			"Deep work · applications",
			"Applications · 2nd block",
			"Maghrib",
			"Push + handstand",
			"Isha",
			"Dinner · chicken karahi",
			"Interview prep · Acme",
			"Night routine",
			"Sleep",
		]);
		expect(
			draftPlan(sources, settings, new Date("2026-10-17T09:00:00")).some(
				(block) => block.id === "career-deep-1",
			),
		).toBe(false);
	});

	it("finds the free stretch and what's now", () => {
		expect(freeGaps(blocks, settings)[0]).toEqual({ from: 6 * 60 + 34, to: 9 * 60 });
		const items = withDone(blocks, sources);
		expect(items.find((item) => item.id === "faith-fajr")?.done).toBe(true);
		const current = rightNow(items, 15 * 60 + 28, []);
		expect(current).toMatchObject({ state: "now", item: { title: "Applications · 2nd block" } });
		expect(current?.next?.title).toBe("Maghrib");
		expect(rightNow(items, 15 * 60 + 28, ["career-deep-2"])?.item.title).toBe("Maghrib");
	});
});

describe("sleep, recap and notes", () => {
	const night = parseSleep({
		id: "2026-10-16",
		bedAt: "2026-10-15T23:40:00",
		wakeAt: "2026-10-16T06:20:00",
	});

	it("measures a night", () => {
		expect(night && sleptMinutes(night)).toBe(400);
		expect(sleepWord(400, 450).word).toBe("a bit short");
		expect(sleepWord(445, 450).word).toBe("on target");
		expect(
			parseSleep({ id: "2026-10-16", bedAt: "2026-10-16T06:00:00", wakeAt: "2026-10-16T06:10:00" }),
		).toBeNull();
	});

	it("ties a miss to a late night", () => {
		const logs = [
			{ ...emptyLog("2026-10-13"), kept: 3, total: 3 },
			{ ...emptyLog("2026-10-14"), kept: 1, total: 3 },
			{ ...emptyLog("2026-10-15"), kept: 3, total: 3 },
		];
		const sleep = [
			{ id: "2026-10-14", bedAt: "2026-10-14T00:40:00", wakeAt: "2026-10-14T07:00:00" },
		];
		const range = ["2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16"];
		expect(recap(logs, sleep, range, "2026-10-16")).toEqual({
			days: 3,
			kept: 2,
			missDay: "2026-10-14",
			missAfterLate: true,
		});
		const notes = dailyNotes({
			logs,
			sleep,
			startHours: [7, 7, 8, 19],
			range,
			today: "2026-10-16",
			size: 5,
		});
		expect(notes.map((note) => note.kind)).toEqual(["late-nights", "train-time"]);
	});
});

describe("ask bar", () => {
	it("reads sleep, ticks, next and screens", () => {
		expect(parseDailyLine("slept 23:40 to 06:20", 330)).toEqual({
			kind: "sleep",
			bed: 1420,
			wake: 380,
		});
		expect(parseDailyLine("slept at 11:40 and woke up at 6:20", 330)).toEqual({
			kind: "sleep",
			bed: 1420,
			wake: 380,
		});
		expect(parseDailyLine("slept 7 hours", 330)).toEqual({
			kind: "sleep",
			bed: 330 - 420 + 1440,
			wake: 330,
		});
		expect(parseDailyLine("read 10 pages", 330)).toEqual({ kind: "tick", id: "read" });
		expect(parseDailyLine("phone off", 330)).toEqual({ kind: "tick", id: "phone" });
		expect(parseDailyLine("what's next?", 330)).toEqual({ kind: "next" });
		expect(parseDailyLine("plan my day", 330)).toEqual({ kind: "open", screen: "plan" });
		expect(parseDailyLine("had daal for lunch", 330)).toEqual({
			kind: "other",
			text: "had daal for lunch",
		});
		expect(readClock("6:20 pm", false)).toBe(18 * 60 + 20);
	});
});

describe("model and alarms", () => {
	it("repairs damaged rows", () => {
		expect(
			parseSettings({ minimum: ["pray", "fly", "pray"], bedAt: 5000, sleepTarget: 30 }),
		).toMatchObject({
			minimum: ["pray"],
			bedAt: 1439,
			sleepTarget: 240,
		});
		expect(parseLog({ id: "2026-10-16", energy: 9, kept: 9, total: 3 })).toMatchObject({
			energy: null,
			kept: 3,
		});
		expect(
			parsePlan({
				id: "2026-10-16",
				blocks: [
					{ id: "b", title: "Walk", minutes: 700 },
					{ id: "a", title: "Read", minutes: 600 },
				],
			})?.blocks.map((block) => block.id),
		).toEqual(["a", "b"]);
	});

	it("plans the Fajr, wind-down and weekend alarms", () => {
		const alarms = dailyAlarms(
			{ ...settings, alarms: { fajr: true, windDown: true, weekend: true } },
			330,
			now,
		);
		expect(alarms).toHaveLength(4);
		const fajr = alarms[0];
		expect(fajr && "at" in fajr ? fajr.at.toISOString() : null).toBe(
			new Date("2026-10-17T05:20:00").toISOString(),
		);
	});
});
