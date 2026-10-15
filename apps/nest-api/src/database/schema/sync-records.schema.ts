import { sql } from 'drizzle-orm';
import {
	bigint,
	index,
	jsonb,
	pgSequence,
	pgTable,
	primaryKey,
	timestamp,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core';

import { users } from './users.schema';

/** Hands out the change order that sync cursors page through. */
export const syncRecordsSeq = pgSequence('sync_records_seq');

/**
 * Every document the app syncs (applications, flashcards, …), one row per record. The app's
 * on-device store is the source of truth; this is its backup and the bridge between devices.
 */
export const syncRecords = pgTable(
	'sync_records',
	{
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		collection: varchar('collection', { length: 64 }).notNull(),
		id: varchar('id', { length: 64 }).notNull(),
		data: jsonb('data').notNull(),
		/** Client time of the last change, in ms; the newest change wins. */
		updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
		deletedAt: bigint('deleted_at', { mode: 'number' }),
		/** Bumped on every accepted write; pulls return rows after the client's cursor. */
		seq: bigint('seq', { mode: 'number' })
			.notNull()
			.default(sql`nextval('sync_records_seq')`),
		receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		primaryKey({ columns: [table.userId, table.collection, table.id] }),
		index('sync_records_user_seq_idx').on(table.userId, table.seq),
	],
);

export type SyncRecordRow = typeof syncRecords.$inferSelect;
