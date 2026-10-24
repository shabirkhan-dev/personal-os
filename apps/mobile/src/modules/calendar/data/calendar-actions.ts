import { removeItem, saveItem } from "@/lib/db/collection";
import type { CalendarEvent } from "../lib/calendar-model";
import { calendarEvents } from "./collections";

/** Saves a personal event; it syncs like everything else. */
export function saveEvent(event: CalendarEvent): Promise<void> {
	return saveItem(calendarEvents, event);
}

export function deleteEvent(id: string): Promise<void> {
	return removeItem(calendarEvents, id);
}
