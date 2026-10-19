import { and, asc, eq, gt, inArray, lt, lte, sql } from "drizzle-orm";

import type { Database } from "@/db/client";
import { type SyncRecordRow, syncRecords } from "@/db/schema";
import type { SyncRecordInput } from "./sync.schema";

export type SyncBatchResult = {
	/** Pushed records the server kept its own newer copy of. */
	conflicts: SyncRecordRow[];
	/** Rows changed after the cursor, oldest first, within the page limits. */
	changes: SyncRecordRow[];
	hasMore: boolean;
};

/**
 * Applies pushed changes (newest `updatedAt` wins) and reads what changed after `cursor`, in one
 * transaction. A per-user advisory lock serializes a user's syncs, so a row committed later
 * always has a higher `seq` than every row a concurrent pull could already have returned.
 */
export async function pushAndPull(
	db: Database,
	userId: string,
	changes: readonly SyncRecordInput[],
	cursor: number,
	limit: { rows: number; bytes: number },
): Promise<SyncBatchResult> {
	return db.transaction(async (tx) => {
		await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${userId}, 0))`);

		const conflicts: SyncRecordRow[] = [];
		if (changes.length > 0) {
			const accepted = await tx
				.insert(syncRecords)
				.values(
					changes.map((change) => ({
						userId,
						collection: change.collection,
						id: change.id,
						data: change.data,
						updatedAt: change.updatedAt,
						deletedAt: change.deletedAt,
					})),
				)
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
				.returning({ collection: syncRecords.collection, id: syncRecords.id });

			const acceptedKeys = new Set(accepted.map((row) => `${row.collection}/${row.id}`));
			const rejected = changes.filter(
				(change) => !acceptedKeys.has(`${change.collection}/${change.id}`),
			);
			if (rejected.length > 0) {
				const rejectedKeys = new Set(rejected.map((change) => `${change.collection}/${change.id}`));
				const rows = await tx
					.select()
					.from(syncRecords)
					.where(
						and(
							eq(syncRecords.userId, userId),
							inArray(
								syncRecords.id,
								rejected.map((change) => change.id),
							),
						),
					);
				conflicts.push(...rows.filter((row) => rejectedKeys.has(`${row.collection}/${row.id}`)));
			}
		}

		// Sizes first, so the page can stop at a byte budget before any data is loaded.
		const after = and(eq(syncRecords.userId, userId), gt(syncRecords.seq, cursor));
		const sizes = await tx
			.select({
				seq: syncRecords.seq,
				bytes: sql<number>`octet_length(${syncRecords.data}::text)`.mapWith(Number),
			})
			.from(syncRecords)
			.where(after)
			.orderBy(asc(syncRecords.seq))
			.limit(limit.rows + 1);
		const take = pageLength(
			sizes.slice(0, limit.rows).map((row) => row.bytes),
			limit.bytes,
		);
		const lastSeq = sizes[take - 1]?.seq;
		const pulled =
			lastSeq === undefined
				? []
				: await tx
						.select()
						.from(syncRecords)
						.where(and(after, lte(syncRecords.seq, lastSeq)))
						.orderBy(asc(syncRecords.seq));

		return { conflicts, changes: pulled, hasMore: sizes.length > take };
	});
}

/** How many rows fit in `budget` bytes; always at least one, so a large record still moves. */
export function pageLength(sizes: readonly number[], budget: number): number {
	let used = 0;
	let take = 0;
	for (const size of sizes) {
		if (take > 0 && used + size > budget) break;
		used += size;
		take += 1;
	}
	return take;
}
