import { createDocumentStore } from "@/lib/storage/document-store";
import { asBoolean, isRecord } from "@/lib/storage/parse";

/**
 * Whether this phone pulls from its health store, and when it last did. Per phone, not synced:
 * the other phone has its own store and its own permission.
 */
export type HealthSyncDoc = { enabled: boolean; lastSyncAt: string | null };

export const useHealthSyncSettings = createDocumentStore<HealthSyncDoc>(
	"health-sync",
	{ enabled: false, lastSyncAt: null },
	(raw) => ({
		enabled: isRecord(raw) ? asBoolean(raw.enabled, false) : false,
		lastSyncAt:
			isRecord(raw) &&
			typeof raw.lastSyncAt === "string" &&
			!Number.isNaN(Date.parse(raw.lastSyncAt))
				? raw.lastSyncAt
				: null,
	}),
);
