import { create } from "zustand";
import type { WakeStatus } from "@/lib/voice";
import { createDocumentStore } from "@/lib/storage/document-store";
import { asBoolean, isRecord } from "@/lib/storage/parse";

/** Whether "Hey OS" listens while the app is open; off until the person turns it on. */
export type HeyOsDoc = { enabled: boolean };

export const useHeyOsSettings = createDocumentStore<HeyOsDoc>(
	"hey-os",
	{ enabled: false },
	(raw) => ({
		enabled: isRecord(raw) ? asBoolean(raw.enabled, false) : false,
	}),
);

/** What the listener is doing right now, for the Profile row. */
export const useHeyOsStatus = create<{ status: WakeStatus }>(() => ({ status: "off" }));
