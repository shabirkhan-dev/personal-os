import { index, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { users } from './users.schema';

/**
 * Schedule types:
 * - daily: runs every day
 * - specific_days: runs on weekdays listed in daysOfWeek (ISO numbers, e.g. "1,3,5")
 */
export const ROUTINE_SCHEDULE_TYPES = ['daily', 'specific_days'] as const;
export type RoutineScheduleType = (typeof ROUTINE_SCHEDULE_TYPES)[number];

export const routines = pgTable(
	'routines',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		name: varchar('name', { length: 120 }).notNull(),
		description: varchar('description', { length: 500 }),
		scheduleType: varchar('schedule_type', { length: 16 })
			.notNull()
			.default('daily' satisfies RoutineScheduleType),
		daysOfWeek: varchar('days_of_week', { length: 13 }),
		archivedAt: timestamp('archived_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		index('routines_user_id_idx').on(table.userId),
		index('routines_archived_at_idx').on(table.archivedAt),
	],
);

export type RoutineRecord = typeof routines.$inferSelect;
export type NewRoutineRecord = typeof routines.$inferInsert;
