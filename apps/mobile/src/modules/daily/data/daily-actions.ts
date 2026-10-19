import { listItems, removeItem, saveItem } from "@/lib/db/collection";
import { dayKey } from "@/lib/day";
import {
	type Block,
	type DailySettings,
	type DayLog,
	emptyLog,
	type MinimumId,
	type SleepLog,
	type WindDownId,
} from "../lib/daily-model";
import { dailySettings, dayLogs, dayPlans, sleepLogs } from "./collections";

/** Every Daily write. Each saves to the record store, which refreshes the screens and syncs. */

export function saveSettings(settings: DailySettings): Promise<void> {
	return saveItem(dailySettings, settings);
}

export function saveLog(log: DayLog): Promise<void> {
	return saveItem(dayLogs, log);
}

/**
 * Day-log writes run one after another and each starts from the stored log, not the screen's
 * copy, so two fast taps before the screen refreshes both land.
 */
let logWrites: Promise<unknown> = Promise.resolve();

function updateLog(
	day: string,
	change: (current: DayLog, stored: boolean) => DayLog | null,
): Promise<void> {
	const run = logWrites.then(async () => {
		const stored = (await listItems(dayLogs)).find((item) => item.id === day);
		const next = change(stored ?? emptyLog(day), stored !== undefined);
		if (next) await saveLog(next);
	});
	logWrites = run.catch(() => undefined);
	return run;
}

const toggled = <T>(list: readonly T[], id: T): T[] =>
	list.includes(id) ? list.filter((item) => item !== id) : [...list, id];

export function toggleTick(day: string, id: MinimumId): Promise<void> {
	return updateLog(day, (current) => ({ ...current, ticked: toggled(current.ticked, id) }));
}

export function toggleWindDown(day: string, id: WindDownId): Promise<void> {
	return updateLog(day, (current) => ({ ...current, windDown: toggled(current.windDown, id) }));
}

export function pushLater(day: string, blockId: string): Promise<void> {
	return updateLog(day, (current) => ({
		...current,
		later: [...new Set([...current.later, blockId])],
	}));
}

/**
 * Keeps today's minimum-day result, so the streak still knows it tomorrow. `known` is the log the
 * screen has: when it already holds this result nothing is written.
 */
export function recordResult(
	known: DayLog | null,
	day: string,
	kept: number,
	total: number,
): Promise<void> | null {
	if (known && known.kept === kept && known.total === total) return null;
	return updateLog(day, (current, stored) =>
		stored && current.kept === kept && current.total === total ? null : { ...current, kept, total },
	);
}

export function closeDay(
	day: string,
	input: { energy: number | null; good: string; kept: number; total: number },
	now = new Date(),
): Promise<void> {
	return updateLog(day, (current) => ({
		...current,
		...input,
		good: input.good.trim(),
		closedAt: now.toISOString(),
	}));
}

export function markBrief(day: string, now = new Date()): Promise<void> {
	return updateLog(day, (current) => ({ ...current, briefAt: now.toISOString() }));
}

export function saveSleep(bed: Date, wake: Date): Promise<void> {
	const log: SleepLog = { id: dayKey(wake), bedAt: bed.toISOString(), wakeAt: wake.toISOString() };
	return saveItem(sleepLogs, log);
}

export function removeSleep(id: string): Promise<void> {
	return removeItem(sleepLogs, id);
}

export function savePlan(day: string, blocks: readonly Block[], now = new Date()): Promise<void> {
	return saveItem(dayPlans, {
		id: day,
		blocks: [...blocks].sort((a, b) => a.minutes - b.minutes),
		createdAt: now.toISOString(),
	});
}

export function removePlan(day: string): Promise<void> {
	return removeItem(dayPlans, day);
}
