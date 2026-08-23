import { index, pgTable, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

import { routineItems } from './routine-items.schema';
import { routines } from './routines.schema';
import { users } from './users.schema';

/**
 * Per-item completion log. One row per (user, item, day).
 * `completedOn` is a calendar date in the user's timezone (stored as YYYY-MM-DD),
 * so streaks and "today" queries are timezone-correct.
 */
export const routineCompletions = pgTable(
	'routine_completions',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		routineId: uuid('routine_id')
			.notNull()
			.references(() => routines.id, { onDelete: 'cascade' }),
		itemId: uuid('item_id')
			.notNull()
			.references(() => routineItems.id, { onDelete: 'cascade' }),
		completedOn: varchar('completed_on', { length: 10 }).notNull(),
		completedAt: timestamp('completed_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		uniqueIndex('routine_completions_user_item_day_unique').on(
			table.userId,
			table.itemId,
			table.completedOn,
		),
		index('routine_completions_user_day_idx').on(table.userId, table.completedOn),
	],
);

export type RoutineCompletionRecord = typeof routineCompletions.$inferSelect;
export type NewRoutineCompletionRecord = typeof routineCompletions.$inferInsert;
