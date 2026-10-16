import { defineCollection } from "@/lib/db/collection";
import { parseBill, parseEntry, parseSettings, parseSource } from "../lib/finance-model";

/** Finance's slices of the record store. Names are part of the sync contract: never rename one. */
export const financeSettings = defineCollection("finance-settings", parseSettings);
export const financeEntries = defineCollection("finance-entries", parseEntry);
export const financeBills = defineCollection("finance-bills", parseBill);
export const financeSources = defineCollection("finance-sources", parseSource);
