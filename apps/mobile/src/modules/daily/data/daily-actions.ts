import { removeItem, saveItem } from "@/lib/db/collection";
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

const base = (log: DayLog | null, day: string) => log ?? emptyLog(day);

export function toggleTick(log: DayLog | null, day: string, id: MinimumId): Promise<void> {
	const current = base(log, day);
	const ticked = current.ticked.includes(id)
		? current.ticked.filter((item) => item !== id)
		: [...current.ticked, id];
	return saveLog({ ...current, ticked });
}

export function toggleWindDown(log: DayLog | null, day: string, id: WindDownId): Promise<void> {
	const current = base(log, day);
	const windDown = current.windDown.includes(id)
		? current.windDown.filter((item) => item !== id)
		: [...current.windDown, id];
	return saveLog({ ...current, windDown });
}

export function pushLater(log: DayLog | null, day: string, blockId: string): Promise<void> {
	const current = base(log, day);
	return saveLog({ ...current, later: [...new Set([...current.later, blockId])] });
}

/** Keeps today's minimum-day result, so the streak still knows it tomorrow. */
export function recordResult(
	log: DayLog | null,
	day: string,
	kept: number,
	total: number,
): Promise<void> | null {
	const current = base(log, day);
	if (log && current.kept === kept && current.total === total) return null;
	return saveLog({ ...current, kept, total });
}

export function closeDay(
	log: DayLog | null,
	day: string,
	input: { energy: number | null; good: string; kept: number; total: number },
	now = new Date(),
): Promise<void> {
	return saveLog({
		...base(log, day),
		...input,
		good: input.good.trim(),
		closedAt: now.toISOString(),
	});
}

export function markBrief(log: DayLog | null, day: string, now = new Date()): Promise<void> {
	return saveLog({ ...base(log, day), briefAt: now.toISOString() });
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
