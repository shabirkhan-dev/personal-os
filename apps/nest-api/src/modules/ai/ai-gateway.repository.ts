import { Injectable } from '@nestjs/common';
import { and, asc, eq, sql } from 'drizzle-orm';

import { DatabaseService } from '@/database/database.service';
import {
	type AiChatMessageRecord,
	type AiChatSessionRecord,
	aiChatMessages,
	aiChatSessions,
} from '@/database/schema';

@Injectable()
export class AiGatewayRepository {
	constructor(private readonly database: DatabaseService) {}

	async createSession(values: typeof aiChatSessions.$inferInsert): Promise<AiChatSessionRecord> {
		const [session] = await this.database.db.insert(aiChatSessions).values(values).returning();
		if (!session) throw new Error('AI chat session insert did not return a record');
		return session;
	}

	async findSession(userId: string, sessionId: string): Promise<AiChatSessionRecord | null> {
		const [session] = await this.database.db
			.select()
			.from(aiChatSessions)
			.where(and(eq(aiChatSessions.id, sessionId), eq(aiChatSessions.userId, userId)))
			.limit(1);
		return session ?? null;
	}

	listSessions(userId: string, limit: number, offset: number): Promise<AiChatSessionRecord[]> {
		return this.database.db
			.select()
			.from(aiChatSessions)
			.where(eq(aiChatSessions.userId, userId))
			.orderBy(sql`${aiChatSessions.updatedAt} DESC`)
			.limit(limit)
			.offset(offset);
	}

	listMessages(sessionId: string, userId: string, limit: number): Promise<AiChatMessageRecord[]> {
		return this.database.db
			.select()
			.from(aiChatMessages)
			.where(and(eq(aiChatMessages.sessionId, sessionId), eq(aiChatMessages.userId, userId)))
			.orderBy(asc(aiChatMessages.createdAt))
			.limit(limit);
	}

	async countMessages(sessionId: string): Promise<number> {
		const [row] = await this.database.db
			.select({ count: sql<number>`count(*)::int` })
			.from(aiChatMessages)
			.where(eq(aiChatMessages.sessionId, sessionId));
		return row?.count ?? 0;
	}

	async insertMessage(values: typeof aiChatMessages.$inferInsert): Promise<AiChatMessageRecord> {
		const [message] = await this.database.db.insert(aiChatMessages).values(values).returning();
		if (!message) throw new Error('AI chat message insert did not return a record');
		return message;
	}

	async touchSession(sessionId: string): Promise<void> {
		await this.database.db
			.update(aiChatSessions)
			.set({ updatedAt: new Date() })
			.where(eq(aiChatSessions.id, sessionId));
	}
}
