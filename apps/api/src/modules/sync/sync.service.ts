import { settings } from "@/config/settings";
import type { Database } from "@/db/client";
import type { SyncRecordRow } from "@/db/schema";
import { pushAndPull } from "./sync.repository";
import {
	type SyncRecordInput,
	type SyncRecordView,
	type SyncRejection,
	type SyncRequest,
	type SyncResponse,
	syncRecordSchema,
} from "./sync.schema";

/** One round: push the phone's changes, pull what changed after its cursor (paged). */
export async function sync(
	db: Database,
	userId: string,
	request: SyncRequest,
	now = Date.now(),
): Promise<SyncResponse> {
	const { accepted, rejected } = sortChanges(request.changes, now + settings.sync.maxClockSkewMs);
	if (rejected.length > 0) console.warn("[sync] skipped records", userId, rejected);

	const cursor = request.cursor === null ? 0 : Number(request.cursor);
	const result = await pushAndPull(db, userId, accepted, cursor, {
		rows: settings.sync.pullPage,
		bytes: settings.sync.pullBytes,
	});
	const last = result.changes.at(-1);
	return {
		cursor: String(last ? last.seq : cursor),
		changes: result.changes.map(toView),
		conflicts: result.conflicts.map(toView),
		rejected,
		hasMore: result.hasMore,
	};
}

/**
 * Checks each pushed change on its own. Invalid ones are rejected rather than failing the batch,
 * which would make the phone resend the same batch forever. Times past `latest` are clamped, and
 * of two changes to one record the newer is kept.
 */
export function sortChanges(
	changes: readonly unknown[],
	latest: number,
): { accepted: SyncRecordInput[]; rejected: SyncRejection[] } {
	const accepted: SyncRecordInput[] = [];
	const rejected: SyncRejection[] = [];
	const at = new Map<string, number>();
	for (const raw of changes) {
		const parsed = syncRecordSchema.safeParse(raw);
		if (!parsed.success) {
			rejected.push({ ...identify(raw), reason: "invalid" });
			continue;
		}
		const change = {
			...parsed.data,
			updatedAt: Math.min(parsed.data.updatedAt, latest),
			deletedAt: parsed.data.deletedAt === null ? null : Math.min(parsed.data.deletedAt, latest),
		};
		const key = `${change.collection}/${change.id}`;
		const index = at.get(key);
		if (index === undefined) {
			at.set(key, accepted.length);
			accepted.push(change);
			continue;
		}
		const kept = accepted[index];
		if (kept && change.updatedAt > kept.updatedAt) accepted[index] = change;
		rejected.push({ collection: change.collection, id: change.id, reason: "duplicate" });
	}
	return { accepted, rejected };
}

function identify(raw: unknown): Pick<SyncRejection, "collection" | "id"> {
	const record = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
	return { collection: shortText(record.collection), id: shortText(record.id) };
}

function shortText(value: unknown): string | null {
	return typeof value === "string" ? value.slice(0, 64) : null;
}

function toView(row: SyncRecordRow): SyncRecordView {
	return {
		collection: row.collection,
		id: row.id,
		data: row.data,
		updatedAt: row.updatedAt,
		deletedAt: row.deletedAt,
	};
}
