import { index, integer, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

/** A six-digit code sent by email. Keyed by email, so no account exists until one is used. */
export const signInCodes = pgTable(
	"sign_in_codes",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		email: varchar("email", { length: 320 }).notNull(),
		/** Display name to use if this code creates the account. */
		displayName: varchar("display_name", { length: 100 }),
		codeHash: varchar("code_hash", { length: 64 }).notNull(),
		attempts: integer("attempts").notNull().default(0),
		expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
		consumedAt: timestamp("consumed_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [index("sign_in_codes_email_idx").on(table.email, table.createdAt)],
);

export type SignInCodeRow = typeof signInCodes.$inferSelect;
