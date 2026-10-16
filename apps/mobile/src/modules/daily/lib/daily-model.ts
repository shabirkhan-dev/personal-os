import { asArray, asBoolean, asNumber, asString, isRecord, oneOf } from "@/lib/storage/parse";

/**
 * Daily life's documents: the minimum day it protects, each day's log (ticks, energy, the one
 * good thing, the close), sleep, and the day plan. Read back through `parse` so an older or
 * damaged row becomes a valid value.
 */

export const MINIMUM_IDS = [
	"pray",
	"train",
	"protein",
	"apply",
	"routines",
	"read",
	"phone",
] as const;
export type MinimumId = (typeof MINIMUM_IDS)[number];

export const PLAN_MODULES = [
	"faith",
	"career",
	"food",
	"workout",
	"skincare",
	"finance",
	"fashion",
	"daily-life",
] as const;
export type PlanModule = (typeof PLAN_MODULES)[number];

export const WIND_DOWN = ["phone", "skin", "dua", "lights", "bed"] as const;
export type WindDownId = (typeof WIND_DOWN)[number];

export type DailySettings = {
	id: "settings";
	setUp: boolean;
	minimum: MinimumId[];
	/** Minutes after midnight. */
	bedAt: number;
	wakeAt: number;
	weekendWakeAt: number;
	windDownAt: number;
	/** Minutes of sleep to aim for. */
	sleepTarget: number;
	/** Pages for "Read N pages". */
	readPages: number;
	alarms: { fajr: boolean; windDown: boolean; weekend: boolean };
};

export type DayLog = {
	/** "YYYY-MM-DD". */
	id: string;
	/** Daily's own minimum items ticked by hand (read, phone). */
	ticked: MinimumId[];
	windDown: WindDownId[];
	energy: number | null;
	good: string;
	/** Plan blocks pushed with Later. */
	later: string[];
	briefAt: string | null;
	closedAt: string | null;
	/** The minimum day as it stood when last seen, so past days keep their result. */
	kept: number;
	total: number;
};

/** A night's sleep; the id is the day it ended (the morning). */
export type SleepLog = { id: string; bedAt: string; wakeAt: string };

export type Block = {
	id: string;
	minutes: number;
	length: number;
	title: string;
	detail: string;
	module: PlanModule;
};

export type DayPlan = { id: string; blocks: Block[]; createdAt: string };

// --- parsing ------------------------------------------------------------------------------------

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const asDay = (value: unknown) => (typeof value === "string" && DAY.test(value) ? value : null);
const asIso = (value: unknown) =>
	typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : null;
const minute = (value: unknown, fallback: number) =>
	Math.min(1439, Math.max(0, Math.round(asNumber(value, fallback))));
const some = <T extends string>(value: unknown, options: readonly T[]): T[] => [
	...new Set(
		asArray(value, (item) =>
			typeof item === "string" && (options as readonly string[]).includes(item)
				? (item as T)
				: null,
		),
	),
];

export function defaultSettings(): DailySettings {
	return {
		id: "settings",
		setUp: false,
		minimum: ["pray", "train", "protein", "apply", "routines"],
		bedAt: 23 * 60,
		wakeAt: 5 * 60 + 30,
		weekendWakeAt: 6 * 60 + 30,
		windDownAt: 22 * 60 + 30,
		sleepTarget: 7 * 60 + 30,
		readPages: 10,
		alarms: { fajr: true, windDown: true, weekend: false },
	};
}

export function parseSettings(raw: unknown): DailySettings | null {
	if (!isRecord(raw)) return null;
	const base = defaultSettings();
	const alarms = isRecord(raw.alarms) ? raw.alarms : {};
	return {
		id: "settings",
		setUp: asBoolean(raw.setUp, false),
		minimum: Array.isArray(raw.minimum) ? some(raw.minimum, MINIMUM_IDS) : base.minimum,
		bedAt: minute(raw.bedAt, base.bedAt),
		wakeAt: minute(raw.wakeAt, base.wakeAt),
		weekendWakeAt: minute(raw.weekendWakeAt, base.weekendWakeAt),
		windDownAt: minute(raw.windDownAt, base.windDownAt),
		sleepTarget: Math.min(
			12 * 60,
			Math.max(4 * 60, Math.round(asNumber(raw.sleepTarget, base.sleepTarget))),
		),
		readPages: Math.min(200, Math.max(1, Math.round(asNumber(raw.readPages, base.readPages)))),
		alarms: {
			fajr: asBoolean(alarms.fajr, base.alarms.fajr),
			windDown: asBoolean(alarms.windDown, base.alarms.windDown),
			weekend: asBoolean(alarms.weekend, base.alarms.weekend),
		},
	};
}

export function emptyLog(day: string): DayLog {
	return {
		id: day,
		ticked: [],
		windDown: [],
		energy: null,
		good: "",
		later: [],
		briefAt: null,
		closedAt: null,
		kept: 0,
		total: 0,
	};
}

export function parseLog(raw: unknown): DayLog | null {
	if (!isRecord(raw)) return null;
	const id = asDay(raw.id);
	if (!id) return null;
	const energy = asNumber(raw.energy, 0);
	const total = Math.max(0, Math.min(7, Math.round(asNumber(raw.total, 0))));
	return {
		id,
		ticked: some(raw.ticked, MINIMUM_IDS),
		windDown: some(raw.windDown, WIND_DOWN),
		energy: energy >= 1 && energy <= 5 ? Math.round(energy) : null,
		good: asString(raw.good, "").slice(0, 200),
		later: asArray(raw.later, (item) => (typeof item === "string" ? item : null)),
		briefAt: asIso(raw.briefAt),
		closedAt: asIso(raw.closedAt),
		kept: Math.max(0, Math.min(total, Math.round(asNumber(raw.kept, 0)))),
		total,
	};
}

export function parseSleep(raw: unknown): SleepLog | null {
	if (!isRecord(raw)) return null;
	const id = asDay(raw.id);
	const bedAt = asIso(raw.bedAt);
	const wakeAt = asIso(raw.wakeAt);
	if (!id || !bedAt || !wakeAt) return null;
	const minutes = (Date.parse(wakeAt) - Date.parse(bedAt)) / 60_000;
	return minutes > 30 && minutes < 18 * 60 ? { id, bedAt, wakeAt } : null;
}

function parseBlock(raw: unknown): Block | null {
	if (!isRecord(raw)) return null;
	const id = asString(raw.id, "");
	const title = asString(raw.title, "").trim();
	if (!id || !title) return null;
	return {
		id,
		minutes: minute(raw.minutes, 9 * 60),
		length: Math.min(600, Math.max(0, Math.round(asNumber(raw.length, 30)))),
		title: title.slice(0, 80),
		detail: asString(raw.detail, "").slice(0, 80),
		module: oneOf(raw.module, PLAN_MODULES, "daily-life"),
	};
}

export function parsePlan(raw: unknown): DayPlan | null {
	if (!isRecord(raw)) return null;
	const id = asDay(raw.id);
	if (!id) return null;
	return {
		id,
		blocks: asArray(raw.blocks, parseBlock).sort((a, b) => a.minutes - b.minutes),
		createdAt: asIso(raw.createdAt) ?? new Date(0).toISOString(),
	};
}
