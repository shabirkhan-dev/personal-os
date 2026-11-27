import type { Memory, NewMessage, StoredMessage, ToolContent } from "@personal-os/ai";
import type { ThreadSummary } from "@personal-os/domain/assistant";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

import type { Database } from "@/db/client";
import {
	type AssistantMessageRow,
	assistantMemories,
	assistantMessages,
	assistantThreads,
	onboardingProfiles,
	users,
} from "@/db/schema";

const asStored = (row: AssistantMessageRow) =>
	({ id: row.id, role: row.role, content: row.content }) as StoredMessage;

export async function createThread(db: Database, userId: string, title: string): Promise<string> {
	const [row] = await db
		.insert(assistantThreads)
		.values({ userId, title: title.slice(0, 120) })
		.returning({ id: assistantThreads.id });
	if (!row) throw new Error("thread insert returned nothing");
	return row.id;
}

/** The thread if it is the user's; null otherwise. */
export async function findThread(db: Database, userId: string, threadId: string) {
	const [row] = await db
		.select()
		.from(assistantThreads)
		.where(and(eq(assistantThreads.id, threadId), eq(assistantThreads.userId, userId)));
	return row ?? null;
}

export async function listThreads(db: Database, userId: string): Promise<ThreadSummary[]> {
	const rows = await db
		.select()
		.from(assistantThreads)
		.where(eq(assistantThreads.userId, userId))
		.orderBy(desc(assistantThreads.updatedAt))
		.limit(50);
	return rows.map((row) => ({
		id: row.id,
		title: row.title,
		updatedAt: row.updatedAt.toISOString(),
	}));
}

export async function deleteThread(
	db: Database,
	userId: string,
	threadId: string,
): Promise<boolean> {
	const removed = await db
		.delete(assistantThreads)
		.where(and(eq(assistantThreads.id, threadId), eq(assistantThreads.userId, userId)))
		.returning({ id: assistantThreads.id });
	return removed.length > 0;
}

export async function addMessage(
	db: Database,
	threadId: string,
	message: NewMessage,
): Promise<string> {
	const [row] = await db
		.insert(assistantMessages)
		.values({ threadId, role: message.role, content: message.content })
		.returning({ id: assistantMessages.id });
	await db
		.update(assistantThreads)
		.set({ updatedAt: sql`now()` })
		.where(eq(assistantThreads.id, threadId));
	if (!row) throw new Error("message insert returned nothing");
	return row.id;
}

export async function updateTool(db: Database, messageId: string, content: ToolContent) {
	await db.update(assistantMessages).set({ content }).where(eq(assistantMessages.id, messageId));
}

/** The thread's messages in order. */
export async function loadMessages(db: Database, threadId: string): Promise<StoredMessage[]> {
	const rows = await db
		.select()
		.from(assistantMessages)
		.where(eq(assistantMessages.threadId, threadId))
		.orderBy(asc(assistantMessages.position));
	return rows.map(asStored);
}

/** A tool call of the user's, with its thread, found by the model's call id. */
export async function findToolCall(db: Database, userId: string, callId: string) {
	const rows = await db
		.select({ message: assistantMessages, threadUser: assistantThreads.userId })
		.from(assistantMessages)
		.innerJoin(assistantThreads, eq(assistantThreads.id, assistantMessages.threadId))
		.where(
			and(
				eq(assistantThreads.userId, userId),
				eq(assistantMessages.role, "tool"),
				sql`${assistantMessages.content}->>'callId' = ${callId}`,
			),
		)
		.limit(1);
	const row = rows[0]?.message;
	if (!row) return null;
	return { id: row.id, threadId: row.threadId, content: row.content as ToolContent };
}

export async function listMemories(db: Database, userId: string): Promise<Memory[]> {
	const rows = await db
		.select()
		.from(assistantMemories)
		.where(eq(assistantMemories.userId, userId))
		.orderBy(asc(assistantMemories.createdAt));
	return rows.map((row) => ({
		id: row.id,
		text: row.text,
		createdAt: row.createdAt.toISOString(),
	}));
}

export async function deleteMemory(db: Database, userId: string, id: string): Promise<boolean> {
	const removed = await db
		.delete(assistantMemories)
		.where(and(eq(assistantMemories.id, id), eq(assistantMemories.userId, userId)))
		.returning({ id: assistantMemories.id });
	return removed.length > 0;
}

/** The name and modules the person gave at onboarding, for the assistant's instructions. */
export async function loadProfile(db: Database, userId: string) {
	const [user] = await db
		.select({ name: users.displayName, answers: onboardingProfiles.answers })
		.from(users)
		.leftJoin(onboardingProfiles, eq(onboardingProfiles.userId, users.id))
		.where(eq(users.id, userId));
	const answers = (user?.answers ?? {}) as { name?: unknown; modules?: unknown } & Record<
		string,
		unknown
	>;
	const name =
		user?.name ??
		(typeof answers.name === "string" && answers.name.trim() ? answers.name.trim() : null);
	const modules = Array.isArray(answers.modules)
		? answers.modules.filter((id): id is string => typeof id === "string")
		: [];
	return { name, modules, answers: answers as Record<string, unknown> };
}

export async function addMemory(db: Database, userId: string, text: string): Promise<string> {
	const [row] = await db
		.insert(assistantMemories)
		.values({ userId, text })
		.returning({ id: assistantMemories.id });
	if (!row) throw new Error("memory insert returned nothing");
	return row.id;
}

export async function deleteMemories(
	db: Database,
	userId: string,
	ids: readonly string[],
): Promise<number> {
	if (ids.length === 0) return 0;
	const removed = await db
		.delete(assistantMemories)
		.where(and(inArray(assistantMemories.id, [...ids]), eq(assistantMemories.userId, userId)))
		.returning({ id: assistantMemories.id });
	return removed.length;
}
