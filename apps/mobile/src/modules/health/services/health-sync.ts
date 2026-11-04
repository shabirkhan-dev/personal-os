import { listItems, saveItem } from "@/lib/db/collection";
import { addDays } from "@/lib/day";
import { healthReadings } from "../data/collections";
import { changed } from "../lib/health-sync-map";
import { healthStore } from "./health-store";

/** How far back the first sync and every later one look; Health Connect keeps 30 days by default. */
const DAYS_BACK = 14;

/** Pulls the last two weeks from the phone's health store; returns how many readings changed. */
export async function syncHealthStore(now = new Date()): Promise<number> {
	if (!healthStore || (await healthStore.status()) !== "ready") return 0;
	const incoming = await healthStore.read(addDays(now, -DAYS_BACK), now);
	const writes = changed(incoming, await listItems(healthReadings));
	for (const reading of writes) {
		// oxlint-disable-next-line eslint/no-await-in-loop -- the record store writes one at a time
		await saveItem(healthReadings, reading);
	}
	return writes.length;
}
