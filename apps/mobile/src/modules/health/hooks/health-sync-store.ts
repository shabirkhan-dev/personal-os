import { createDocumentStore } from "@/lib/storage/document-store";
import { asBoolean, isRecord } from "@/lib/storage/parse";
import { READING_KINDS } from "../lib/health-model";
import type { SyncReport } from "../services/health-sync";

/**
 * Whether this phone pulls from its health store, when it last did and what it found. Per phone,
 * not synced: the other phone has its own store and its own permission.
 */
export type HealthSyncDoc = {
	enabled: boolean;
	lastSyncAt: string | null;
	lastReport: SyncReport | null;
};

const count = (value: unknown) =>
	typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.round(value) : 0;

function parseReport(raw: unknown): SyncReport | null {
	if (!isRecord(raw)) return null;
	const found: SyncReport["found"] = {};
	if (isRecord(raw.found)) {
		for (const kind of READING_KINDS) {
			const value = count(raw.found[kind]);
			if (value > 0) found[kind] = value;
		}
	}
	return {
		found,
		saved: count(raw.saved),
		allowed: count(raw.allowed),
		failed: Array.isArray(raw.failed)
			? raw.failed.filter((item): item is string => typeof item === "string").slice(0, 20)
			: [],
	};
}

export const useHealthSyncSettings = createDocumentStore<HealthSyncDoc>(
	"health-sync",
	{ enabled: false, lastSyncAt: null, lastReport: null },
	(raw) => ({
		enabled: isRecord(raw) ? asBoolean(raw.enabled, false) : false,
		lastSyncAt:
			isRecord(raw) &&
			typeof raw.lastSyncAt === "string" &&
			!Number.isNaN(Date.parse(raw.lastSyncAt))
				? raw.lastSyncAt
				: null,
		lastReport: isRecord(raw) ? parseReport(raw.lastReport) : null,
	}),
);
