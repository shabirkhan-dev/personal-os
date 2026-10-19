import { addDays, dayKey } from "@/lib/day";
import { clockOf, type DayEntry } from "@/modules/home/lib/module-day";
import type { ModuleId } from "@/modules/onboarding/lib/options";
import type { Block, DailySettings, DayLog, MinimumId, PlanModule, SleepLog } from "./daily-model";

/** The numbers behind Daily life. Pure, so they're tested without a phone. */

/** What the other modules said about today (null when the module is off). */
export type Sources = {
	modules: readonly ModuleId[];
	faith: {
		setUp: boolean;
		entries: DayEntry[];
		prayed: number;
		total: number;
		names: string[];
	} | null;
	career: {
		appliedToday: number;
		dailyTarget: number;
		entries: DayEntry[];
		interviewSoon: { company: string; at: string } | null;
	} | null;
	food: { setUp: boolean; protein: number; proteinTarget: number; entries: DayEntry[] } | null;
	care: {
		setUp: boolean;
		morning: { done: number; total: number; finished: boolean };
		night: { done: number; total: number; finished: boolean };
		entries: DayEntry[];
	} | null;
	workout: { minutesToday: number; plannedToday: boolean; entries: DayEntry[] } | null;
};

// --- minimum day --------------------------------------------------------------------------------

type MinimumDef = { label: string; module: PlanModule; needs: ModuleId | null };

export const MINIMUM: Record<MinimumId, MinimumDef> = {
	pray: { label: "Pray", module: "faith", needs: "faith" },
	train: { label: "Train", module: "workout", needs: "workout" },
	protein: { label: "Protein", module: "food", needs: "food" },
	apply: { label: "Apply", module: "career", needs: "career" },
	routines: { label: "Skin", module: "skincare", needs: "skincare" },
	read: { label: "Read", module: "daily-life", needs: null },
	phone: { label: "Phone", module: "daily-life", needs: null },
};

export const MODULE_LABELS: Record<PlanModule, string> = {
	faith: "Faith",
	career: "Career",
	food: "Food",
	workout: "Training",
	skincare: "Care",
	finance: "Finance",
	fashion: "Fashion",
	"daily-life": "Daily life",
};

/** The minimum items the person can pick: their modules' ones and Daily's own. */
export function availableMinimum(sources: Sources): MinimumId[] {
	return (Object.keys(MINIMUM) as MinimumId[]).filter((id) => {
		const needs = MINIMUM[id].needs;
		return needs === null || sources.modules.includes(needs);
	});
}

export function minimumTitle(id: MinimumId, sources: Sources, settings: DailySettings): string {
	switch (id) {
		case "pray":
			return sources.faith && sources.faith.names.length > 0
				? `Pray ${listWords(sources.faith.names)}`
				: "Pray on time";
		case "train":
			return "Train 20 minutes";
		case "protein":
			return "Hit your protein";
		case "apply": {
			const target = sources.career?.dailyTarget ?? 2;
			return `Send ${target} application${target === 1 ? "" : "s"}`;
		}
		case "routines":
			return "Morning and night routine";
		case "read":
			return `Read ${settings.readPages} pages`;
		case "phone":
			return `No phone after ${clockOf(settings.bedAt)}`;
	}
}

function listWords(words: readonly string[]): string {
	return words.join(", ");
}

export type MinimumState = { value: string; share: number; done: boolean };

/** Where one minimum item stands today. */
export function minimumState(id: MinimumId, sources: Sources, log: DayLog | null): MinimumState {
	const ticked = log?.ticked.includes(id) ?? false;
	switch (id) {
		case "pray": {
			const faith = sources.faith;
			if (!faith || faith.total === 0) return { value: "–", share: 0, done: ticked };
			return {
				value: `${faith.prayed}/${faith.total}`,
				share: faith.prayed / faith.total,
				done: faith.prayed >= faith.total,
			};
		}
		case "train": {
			const minutes = sources.workout?.minutesToday ?? 0;
			if (minutes >= 20 || ticked) return { value: "✓", share: 1, done: true };
			const at = sources.workout?.entries[0];
			return { value: at ? clockOf(at.minutes) : `${minutes}m`, share: minutes / 20, done: false };
		}
		case "protein": {
			const food = sources.food;
			if (!food) return { value: "–", share: 0, done: ticked };
			const share = food.proteinTarget > 0 ? food.protein / food.proteinTarget : 0;
			return { value: `${Math.round(food.protein)}g`, share, done: share >= 0.95 };
		}
		case "apply": {
			const career = sources.career;
			if (!career) return { value: "–", share: 0, done: ticked };
			return {
				value: `${career.appliedToday}/${career.dailyTarget}`,
				share: career.appliedToday / career.dailyTarget,
				done: career.appliedToday >= career.dailyTarget,
			};
		}
		case "routines": {
			const care = sources.care;
			if (!care) return { value: "–", share: 0, done: ticked };
			const done = Number(care.morning.finished) + Number(care.night.finished);
			return {
				value: care.night.finished ? "PM ✓" : care.morning.finished ? "AM ✓" : "0/2",
				share: done / 2,
				done: done === 2,
			};
		}
		case "read":
		case "phone":
			return { value: ticked ? "✓" : "–", share: ticked ? 1 : 0, done: ticked };
	}
}

export function keptToday(
	minimum: readonly MinimumId[],
	sources: Sources,
	log: DayLog | null,
): number {
	return minimum.filter((id) => minimumState(id, sources, log).done).length;
}

/**
 * Days the minimum day was kept, counting back from today. "Never miss twice": one missed day
 * doesn't end the streak (it just isn't counted); two in a row do. Today counts once kept, and
 * doesn't break anything while it's still open.
 */
export function streak(logs: readonly DayLog[], now: Date): number {
	const byDay = new Map(logs.map((log) => [log.id, log]));
	const kept = (day: string) => {
		const log = byDay.get(day);
		return log !== undefined && log.total > 0 && log.kept >= log.total;
	};
	let count = kept(dayKey(now)) ? 1 : 0;
	let misses = 0;
	for (let back = 1; back < 400; back += 1) {
		// A day with no log is a miss like any other: it still gets its one pass.
		if (kept(dayKey(addDays(now, -back)))) {
			count += 1;
			misses = 0;
		} else {
			misses += 1;
			if (misses >= 2) break;
		}
	}
	return count;
}

// --- the plan -----------------------------------------------------------------------------------

const block = (
	module: PlanModule,
	minutes: number,
	length: number,
	title: string,
	detail: string,
	id = `${module}-${minutes}-${title}`,
): Block => ({ id, minutes, length, title, detail, module });

const lengthLabel = (minutes: number) =>
	minutes >= 60
		? `${Math.floor(minutes / 60)} h${minutes % 60 ? ` ${minutes % 60} min` : ""}`
		: `${minutes} min`;

/** A day drafted from the modules: prayers, meals, routines, training, work blocks and sleep. */
export function draftPlan(sources: Sources, settings: DailySettings, date: Date): Block[] {
	const blocks: Block[] = [];
	const weekend = date.getDay() === 0 || date.getDay() === 6;
	for (const entry of sources.faith?.entries ?? []) {
		const fajr = /fajr/i.test(entry.title);
		blocks.push(
			block(
				"faith",
				entry.minutes,
				fajr ? 15 : 10,
				fajr ? `${entry.title} and Quran` : entry.title,
				`Faith · ${fajr ? 15 : 10} min`,
				entry.id,
			),
		);
	}
	for (const entry of sources.care?.entries ?? []) {
		blocks.push(
			block(
				"skincare",
				entry.minutes,
				entry.length,
				entry.title,
				`Care · ${entry.length} min`,
				entry.id,
			),
		);
	}
	for (const entry of sources.food?.entries ?? []) {
		blocks.push(block("food", entry.minutes, 20, entry.title, `Food · ${entry.detail}`, entry.id));
	}
	for (const entry of sources.workout?.entries ?? []) {
		blocks.push(
			block(
				"workout",
				entry.minutes,
				entry.length,
				entry.title,
				`Training · ${entry.length} min`,
				entry.id,
			),
		);
	}
	if (sources.career) {
		for (const entry of sources.career.entries) {
			blocks.push(
				block(
					"career",
					entry.minutes,
					entry.length,
					entry.title,
					`Career · ${entry.length} min`,
					entry.id,
				),
			);
		}
		if (!weekend) {
			blocks.push(
				block("career", 9 * 60, 120, "Deep work · applications", "Career · 2 h", "career-deep-1"),
			);
			blocks.push(
				block("career", 15 * 60, 120, "Applications · 2nd block", "Career · 2 h", "career-deep-2"),
			);
		}
		if (sources.career.interviewSoon) {
			blocks.push(
				block(
					"career",
					21 * 60,
					30,
					`Interview prep · ${sources.career.interviewSoon.company}`,
					"Career · 30 min",
					"career-prep",
				),
			);
		}
	}
	blocks.push(
		block(
			"daily-life",
			settings.bedAt,
			0,
			"Sleep",
			`Daily · ${lengthLabel(settings.sleepTarget)}`,
			"daily-sleep",
		),
	);
	return blocks.sort((a, b) => a.minutes - b.minutes || a.title.localeCompare(b.title));
}

/** Open stretches of at least `min` minutes between waking and bed: time left free on purpose. */
export function freeGaps(
	blocks: readonly Block[],
	settings: DailySettings,
	min = 90,
): { from: number; to: number }[] {
	const sorted = [...blocks]
		.filter((item) => item.module !== "daily-life")
		.sort((a, b) => a.minutes - b.minutes);
	const gaps: { from: number; to: number }[] = [];
	let cursor = settings.wakeAt;
	for (const item of sorted) {
		if (item.minutes - cursor >= min) gaps.push({ from: cursor, to: item.minutes });
		cursor = Math.max(cursor, item.minutes + item.length);
	}
	if (settings.bedAt - 60 - cursor >= min) gaps.push({ from: cursor, to: settings.bedAt - 60 });
	return gaps;
}

export type AgendaItem = Block & { done: boolean };

/** The plan's blocks with whatever the modules say is done. */
export function withDone(blocks: readonly Block[], sources: Sources): AgendaItem[] {
	const done = new Set(
		[
			...(sources.faith?.entries ?? []),
			...(sources.care?.entries ?? []),
			...(sources.food?.entries ?? []),
			...(sources.workout?.entries ?? []),
			...(sources.career?.entries ?? []),
		]
			.filter((entry) => entry.done)
			.map((entry) => entry.id),
	);
	return blocks.map((item) => ({ ...item, done: done.has(item.id) }));
}

export type RightNow = { item: AgendaItem; state: "now" | "next"; next: AgendaItem | null };

/** What's happening now (a block covering this minute and not done), else the next one. */
export function rightNow(
	items: readonly AgendaItem[],
	minutes: number,
	later: readonly string[],
): RightNow | null {
	const open = items.filter(
		(item) => !item.done && !later.includes(item.id) && item.module !== "daily-life",
	);
	const current = open.find(
		(item) => item.minutes <= minutes && minutes < item.minutes + Math.max(item.length, 15),
	);
	const item = current ?? open.find((other) => other.minutes > minutes);
	if (!item) return null;
	const next =
		items.find((other) => other.minutes > item.minutes && other.id !== item.id && !other.done) ??
		null;
	return { item, state: current ? "now" : "next", next };
}

// --- sleep --------------------------------------------------------------------------------------

export function sleptMinutes(log: SleepLog): number {
	return Math.round((Date.parse(log.wakeAt) - Date.parse(log.bedAt)) / 60_000);
}

export function hoursLabel(minutes: number): string {
	const h = Math.floor(minutes / 60);
	const m = Math.round(minutes % 60);
	return m ? `${h}h ${m}m` : `${h}h`;
}

/** "a bit short", "on target", "short". */
export function sleepWord(
	minutes: number,
	target: number,
): { word: string; tone: "textSuccess" | "textWarning" | "textDanger" } {
	if (minutes >= target - 15) return { word: "on target", tone: "textSuccess" };
	if (minutes >= target - 75) return { word: "a bit short", tone: "textWarning" };
	return { word: "short", tone: "textDanger" };
}

export function sleepWeek(
	logs: readonly SleepLog[],
	days: readonly string[],
): { day: string; minutes: number | null }[] {
	return days.map((day) => {
		const log = logs.find((item) => item.id === day);
		return { day, minutes: log ? sleptMinutes(log) : null };
	});
}

export function averageSleep(logs: readonly SleepLog[], days: readonly string[]): number | null {
	const values = sleepWeek(logs, days).flatMap((item) =>
		item.minutes === null ? [] : [item.minutes],
	);
	return values.length
		? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
		: null;
}

/** Bed after midnight (between 00:00 and 05:00). */
export function lateNight(log: SleepLog): boolean {
	const hour = new Date(log.bedAt).getHours();
	return hour < 5;
}

export function weekDays(date: Date): string[] {
	const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
	return Array.from({ length: 7 }, (_, step) => dayKey(addDays(monday, step)));
}

/** The last `count` days ending today, oldest first. */
export function lastDays(now: Date, count: number): string[] {
	return Array.from({ length: count }, (_, step) => dayKey(addDays(now, step - count + 1)));
}

// --- insights -----------------------------------------------------------------------------------

export type DailyNote =
	| { kind: "late-nights"; misses: number; late: number }
	| { kind: "train-time"; morning: number; evening: number; total: number }
	| { kind: "too-big"; kept: number; days: number; size: number };

export type Recap = { days: number; kept: number; missDay: string | null; missAfterLate: boolean };

export function recap(
	logs: readonly DayLog[],
	sleep: readonly SleepLog[],
	range: readonly string[],
	today: string,
): Recap {
	const seen = logs.filter(
		(log) => range.includes(log.id) && log.total > 0 && (log.id < today || log.kept >= log.total),
	);
	const misses = seen.filter((log) => log.kept < log.total);
	const lastMiss = misses.at(-1);
	const night = lastMiss ? sleep.find((item) => item.id === lastMiss.id) : undefined;
	return {
		days: seen.length,
		kept: seen.length - misses.length,
		missDay: lastMiss?.id ?? null,
		missAfterLate: night ? lateNight(night) : false,
	};
}

export function dailyNotes(input: {
	logs: readonly DayLog[];
	sleep: readonly SleepLog[];
	startHours: readonly number[];
	range: readonly string[];
	today: string;
	size: number;
}): DailyNote[] {
	const notes: DailyNote[] = [];
	const closed = input.logs.filter(
		(log) => input.range.includes(log.id) && log.id < input.today && log.total > 0,
	);
	const misses = closed.filter((log) => log.kept < log.total);
	const late = misses.filter((log) => {
		const night = input.sleep.find((item) => item.id === log.id);
		return night ? lateNight(night) : false;
	}).length;
	if (misses.length > 0 && late > 0)
		notes.push({ kind: "late-nights", misses: misses.length, late });
	const morning = input.startHours.filter((hour) => hour < 12).length;
	const evening = input.startHours.filter((hour) => hour >= 16).length;
	if (input.startHours.length >= 4 && morning !== evening) {
		notes.push({ kind: "train-time", morning, evening, total: input.startHours.length });
	}
	if (
		closed.length >= 5 &&
		(closed.length - misses.length) / closed.length < 0.6 &&
		input.size > 3
	) {
		notes.push({
			kind: "too-big",
			kept: closed.length - misses.length,
			days: closed.length,
			size: input.size,
		});
	}
	return notes;
}
