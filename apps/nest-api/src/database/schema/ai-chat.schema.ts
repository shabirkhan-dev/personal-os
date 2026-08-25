import {
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core';

import { users } from './users.schema';

/**
 * Read-only AI wave v0: sessions store conversation metadata and optional
 * Personal OS context references. Storing sessions/messages does not mutate
 * any durable Personal OS records.
 */
export const aiChatSessions = pgTable(
	'ai_chat_sessions',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		title: varchar('title', { length: 120 }),
		contextRoute: varchar('context_route', { length: 200 }),
		contextEntityType: varchar('context_entity_type', { length: 32 }),
		contextEntityId: uuid('context_entity_id'),
		contextDate: varchar('context_date', { length: 10 }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [index('ai_chat_sessions_user_idx').on(table.userId, table.createdAt)],
);

export const aiChatMessages = pgTable(
	'ai_chat_messages',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		sessionId: uuid('session_id')
			.notNull()
			.references(() => aiChatSessions.id, { onDelete: 'cascade' }),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		role: varchar('role', { length: 16 }).notNull(),
		content: text('content').notNull(),
		sources: jsonb('sources'),
		suggestions: jsonb('suggestions'),
		provider: varchar('provider', { length: 40 }),
		model: varchar('model', { length: 80 }),
		latencyMs: integer('latency_ms'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		index('ai_chat_messages_session_idx').on(table.sessionId, table.createdAt),
		index('ai_chat_messages_user_idx').on(table.userId),
	],
);

export type AiChatSessionRecord = typeof aiChatSessions.$inferSelect;
export type NewAiChatSessionRecord = typeof aiChatSessions.$inferInsert;
export type AiChatMessageRecord = typeof aiChatMessages.$inferSelect;
export type NewAiChatMessageRecord = typeof aiChatMessages.$inferInsert;
