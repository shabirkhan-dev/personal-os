import { defineCollection } from "@/lib/db/collection";
import { parseEvent } from "../lib/calendar-model";

/** Personal calendar events. The name is part of the sync contract: never rename it. */
export const calendarEvents = defineCollection("calendar-events", parseEvent);
