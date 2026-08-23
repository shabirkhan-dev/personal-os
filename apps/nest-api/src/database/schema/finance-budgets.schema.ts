import { bigint, index, pgTable, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

import { users } from './users.schema';

/**
 * Monthly spending limit per category. `month` is `YYYY-MM`.
 * One row per (user, month, category); clients replace the whole month's
 * budget set in one call.
 */
export const financeBudgets = pgTable(
	'finance_budgets',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		month: varchar('month', { length: 7 }).notNull(),
		category: varchar('category', { length: 64 }).notNull(),
		limitMinor: bigint('limit_minor', { mode: 'number' }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		uniqueIndex('finance_budgets_user_month_category_unique').on(
			table.userId,
			table.month,
			table.category,
		),
		index('finance_budgets_user_month_idx').on(table.userId, table.month),
	],
);

export type FinanceBudgetRecord = typeof financeBudgets.$inferSelect;
export type NewFinanceBudgetRecord = typeof financeBudgets.$inferInsert;
