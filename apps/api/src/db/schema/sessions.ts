import { index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { users } from "./users";

/** One signed-in device. The refresh token rotates on every refresh; only its hash is stored. */
export const sessions = pgTable(
	"sessions",
	{
		id: uuid("id").primaryKey(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		refreshTokenHash: varchar("refresh_token_hash", { length: 64 }).notNull(),
		userAgent: text("user_agent"),
		expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
		lastUsedAt: timestamp("last_used_at", { withTimezone: true }).notNull().defaultNow(),
		revokedAt: timestamp("revoked_at", { withTimezone: true }),
		revocationReason: varchar("revocation_reason", { length: 32 }),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [index("sessions_user_id_idx").on(table.userId)],
);

export type SessionRow = typeof sessions.$inferSelect;
