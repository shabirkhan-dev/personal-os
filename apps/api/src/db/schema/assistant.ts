import { bigserial, index, jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { users } from "./users";

/** A conversation with the assistant. */
export const assistantThreads = pgTable(
	"assistant_threads",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		title: varchar("title", { length: 120 }).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [index("assistant_threads_user_updated_idx").on(table.userId, table.updatedAt)],
);

/**
 * One turn of a conversation in the model's own shape (user, assistant with tool calls, tool
 * results), plus what the app shows for it (cards, steps). `position` keeps the order.
 */
export const assistantMessages = pgTable(
	"assistant_messages",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		threadId: uuid("thread_id")
			.notNull()
			.references(() => assistantThreads.id, { onDelete: "cascade" }),
		position: bigserial("position", { mode: "number" }).notNull(),
		role: varchar("role", { length: 16 }).notNull(),
		content: jsonb("content").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [index("assistant_messages_thread_position_idx").on(table.threadId, table.position)],
);

/** Facts the assistant keeps about the person, which they can read and delete. */
export const assistantMemories = pgTable(
	"assistant_memories",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		text: varchar("text", { length: 300 }).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [index("assistant_memories_user_idx").on(table.userId)],
);

export type AssistantMessageRow = typeof assistantMessages.$inferSelect;
