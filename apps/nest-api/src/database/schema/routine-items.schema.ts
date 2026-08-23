import {
	index,
	pgTable,
	smallint,
	text,
	time,
	timestamp,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core';

import { routines } from './routines.schema';
import { users } from './users.schema';

export const routineItems = pgTable(
	'routine_items',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		routineId: uuid('routine_id')
			.notNull()
			.references(() => routines.id, { onDelete: 'cascade' }),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		name: varchar('name', { length: 200 }).notNull(),
		notes: text('notes'),
		targetTime: time('target_time'),
		sortOrder: smallint('sort_order').notNull().default(0),
		archivedAt: timestamp('archived_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		index('routine_items_routine_id_idx').on(table.routineId),
		index('routine_items_user_id_idx').on(table.userId),
	],
);

export type RoutineItemRecord = typeof routineItems.$inferSelect;
export type NewRoutineItemRecord = typeof routineItems.$inferInsert;
