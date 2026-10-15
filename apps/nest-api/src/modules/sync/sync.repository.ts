import { Injectable } from '@nestjs/common';
import { and, asc, eq, gt, inArray, lt, sql } from 'drizzle-orm';

import { DatabaseService } from '@/database/database.service';
import { type SyncRecordRow, syncRecords } from '@/database/schema';
import type { SyncRecordInput } from './sync.dto';

export type SyncBatchResult = {
	/** Pushed records the server kept its own newer copy of. */
	conflicts: SyncRecordRow[];
	/** Rows changed after the cursor, oldest first, at most `limit`. */
	changes: SyncRecordRow[];
	hasMore: boolean;
};

@Injectable()
export class SyncRepository {
	constructor(private readonly database: DatabaseService) {}

	/**
	 * Applies pushed changes (newest `updatedAt` wins) and reads what changed after `cursor`, in one
	 * transaction. A per-user advisory lock serializes a user's syncs, so a row committed later
	 * always has a higher `seq` than every row a concurrent pull could already have returned.
	 */
	async pushAndPull(
		userId: string,
		changes: readonly SyncRecordInput[],
		cursor: number,
		limit: number,
	): Promise<SyncBatchResult> {
		return this.database.db.transaction(async (tx) => {
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
					const rejectedKeys = new Set(
						rejected.map((change) => `${change.collection}/${change.id}`),
					);
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

			const page = await tx
				.select()
				.from(syncRecords)
				.where(and(eq(syncRecords.userId, userId), gt(syncRecords.seq, cursor)))
				.orderBy(asc(syncRecords.seq))
				.limit(limit + 1);

			return {
				conflicts,
				changes: page.slice(0, limit),
				hasMore: page.length > limit,
			};
		});
	}
}
