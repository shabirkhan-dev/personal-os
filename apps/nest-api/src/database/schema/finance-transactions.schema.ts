import { bigint, index, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { users } from './users.schema';

/** Transaction kinds. */
export const FINANCE_TRANSACTION_TYPES = ['expense', 'income'] as const;
export type FinanceTransactionType = (typeof FINANCE_TRANSACTION_TYPES)[number];

/**
 * Ledger entry. `amountMinor` is an integer in the smallest currency unit
 * (paise for INR) to avoid floating-point money bugs.
 * `occurredOn` is a calendar date (`YYYY-MM-DD`) supplied by the client,
 * so grouping matches the user's local day regardless of server timezone.
 */
export const financeTransactions = pgTable(
	'finance_transactions',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		type: varchar('type', { length: 10 }).notNull(),
		amountMinor: bigint('amount_minor', { mode: 'number' }).notNull(),
		currency: varchar('currency', { length: 3 }).notNull().default('INR'),
		category: varchar('category', { length: 64 }),
		note: varchar('note', { length: 280 }),
		occurredOn: varchar('occurred_on', { length: 10 }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		index('finance_transactions_user_date_idx').on(table.userId, table.occurredOn),
		index('finance_transactions_user_type_idx').on(table.userId, table.type),
	],
);

export type FinanceTransactionRecord = typeof financeTransactions.$inferSelect;
export type NewFinanceTransactionRecord = typeof financeTransactions.$inferInsert;
