import { listItems, saveItem } from "@/lib/db/collection";
import { addDays } from "@/lib/day";
import { healthReadings } from "../data/collections";
import type { ReadingKind } from "../lib/health-model";
import { changed } from "../lib/health-sync-map";
import { healthStore } from "./health-store";

/** How far back every sync looks; Health Connect lets a new app read the 30 days before it. */
const DAYS_BACK = 30;

/** What the last sync found, for the card: how many of each kind, and what couldn't be read. */
export type SyncReport = {
	found: Partial<Record<ReadingKind, number>>;
	saved: number;
	allowed: number;
	failed: string[];
};

/** Pulls the last 30 days from the phone's health store and saves what's new or changed. */
export async function syncHealthStore(now = new Date()): Promise<SyncReport> {
	const report: SyncReport = { found: {}, saved: 0, allowed: 0, failed: [] };
	if (!healthStore || (await healthStore.status()) !== "ready") return report;
	const read = await healthStore.read(addDays(now, -DAYS_BACK), now);
	for (const reading of read.readings) {
		report.found[reading.kind] = (report.found[reading.kind] ?? 0) + 1;
	}
	const writes = changed(read.readings, await listItems(healthReadings));
	for (const reading of writes) {
		// oxlint-disable-next-line eslint/no-await-in-loop -- the record store writes one at a time
		await saveItem(healthReadings, reading);
	}
	return { ...report, saved: writes.length, allowed: read.allowed, failed: read.failed };
}
