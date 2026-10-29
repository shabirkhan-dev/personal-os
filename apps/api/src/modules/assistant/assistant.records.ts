import { and, eq, isNull, lt, sql } from "drizzle-orm";

import type { Database } from "@/db/client";
import { syncRecords } from "@/db/schema";

/**
 * The person's synced records, read and written by the assistant's tools. A write is a newer
 * version of the record, exactly as if the phone had pushed it, so the phone pulls it on its
 * next sync and the newest change still wins.
 */

/** Every live record of one collection, read through `parse` (unreadable rows are skipped). */
export async function listRecords<T>(
	db: Database,
	userId: string,
	collection: string,
	parse: (raw: unknown) => T | null,
): Promise<T[]> {
	const rows = await db
		.select({ data: syncRecords.data })
		.from(syncRecords)
		.where(
			and(
				eq(syncRecords.userId, userId),
				eq(syncRecords.collection, collection),
				isNull(syncRecords.deletedAt),
			),
		);
	const out: T[] = [];
	for (const row of rows) {
		const parsed = parse(row.data);
		if (parsed !== null) out.push(parsed);
	}
	return out;
}

export async function getRecord<T>(
	db: Database,
	userId: string,
	collection: string,
	id: string,
	parse: (raw: unknown) => T | null,
): Promise<T | null> {
	const [row] = await db
		.select({ data: syncRecords.data, deletedAt: syncRecords.deletedAt })
		.from(syncRecords)
		.where(
			and(
				eq(syncRecords.userId, userId),
				eq(syncRecords.collection, collection),
				eq(syncRecords.id, id),
			),
		);
	if (!row || row.deletedAt !== null) return null;
	return parse(row.data);
}

/** The last write time handed out, so two writes in one answer never share a time. */
let lastStamp = 0;

/** `at`, moved forward if needed so every write is strictly later than the one before it. */
function stamp(at: number): number {
	lastStamp = Math.max(at, Date.now(), lastStamp + 1);
	return lastStamp;
}

/**
 * Saves a record (or deletes it with `deleted`). It must be newer than the stored version; the
 * write is skipped otherwise, like a stale push from the phone. Returns whether it was kept.
 */
export async function putRecord(
	db: Database,
	userId: string,
	collection: string,
	id: string,
	data: unknown,
	at: number,
	deleted = false,
): Promise<boolean> {
	at = stamp(at);
	const accepted = await db
		.insert(syncRecords)
		.values({ userId, collection, id, data, updatedAt: at, deletedAt: deleted ? at : null })
		.onConflictDoUpdate({
			target: [syncRecords.userId, syncRecords.collection, syncRecords.id],
			set: {
				data: sql`excluded.data`,
				updatedAt: sql`excluded.updated_at`,
				deletedAt: sql`excluded.deleted_at`,
				seq: sql`nextval('sync_records_seq')`,
				receivedAt: sql`now()`,
			},
			setWhere: lt(syncRecords.updatedAt, sql`excluded.updated_at`),
		})
		.returning({ id: syncRecords.id });
	return accepted.length > 0;
}
