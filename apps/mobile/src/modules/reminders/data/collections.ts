import { defineCollection, listItems, saveItem } from "@/lib/db/collection";
import {
	defaultReminderSettings,
	parseReminderSettings,
	type ReminderSettings,
} from "../lib/reminder-settings";

/** Name is part of the sync contract: never rename it. */
export const reminderSettings = defineCollection("reminder-settings", parseReminderSettings);

export async function loadReminderSettings(): Promise<ReminderSettings> {
	const [stored] = await listItems(reminderSettings);
	return stored ?? defaultReminderSettings();
}

export function saveReminderSettings(settings: ReminderSettings): Promise<void> {
	return saveItem(reminderSettings, settings);
}
