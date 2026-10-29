import type {
	AssistantContext,
	Card,
	StepStatus,
	ThreadMessage,
	ThreadSummary,
} from "@personal-os/domain/assistant";
import { and, asc, desc, eq, sql } from "drizzle-orm";

import type { Database } from "@/db/client";
import {
	type AssistantMessageRow,
	assistantMemories,
	assistantMessages,
	assistantThreads,
	onboardingProfiles,
	users,
} from "@/db/schema";
import type { ModelMessage, ModelToolCall } from "./assistant.provider";
import type { UndoWrite } from "./assistant.tool";

/** How a turn is stored: the model's messages plus what the app shows for them. */
export type UserContent = { text: string; context?: AssistantContext };
export type AssistantContent = { text: string; toolCalls?: ModelToolCall[] };
export type ToolStatus = "pending" | "approved" | "declined" | "done" | "failed";
export type ToolContent = {
	callId: string;
	name: string;
	input: unknown;
	label: string;
	status: ToolStatus;
	/** Whether this call waits for the person's yes. */
	needsApproval: boolean;
	/** What the model reads back, once the call has run (or was declined). */
	result: string | null;
	cards: Card[];
	undo?: UndoWrite[];
	undone?: boolean;
};

export type StoredMessage =
	| { id: string; role: "user"; content: UserContent }
	| { id: string; role: "assistant"; content: AssistantContent }
	| { id: string; role: "tool"; content: ToolContent };

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
	message: Omit<StoredMessage, "id">,
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

/** Most messages sent to the model; older ones fall out of the window. */
const WINDOW = 40;

/**
 * The conversation in the model's format. The window starts at a user message, so a tool result
 * never arrives without the call that asked for it. Unfinished calls are left out.
 */
export function toModelMessages(stored: readonly StoredMessage[]): ModelMessage[] {
	let start = Math.max(0, stored.length - WINDOW);
	while (start > 0 && stored[start]?.role !== "user") start -= 1;
	const out: ModelMessage[] = [];
	for (const message of stored.slice(start)) {
		if (message.role === "user") out.push({ role: "user", content: message.content.text });
		else if (message.role === "assistant") {
			out.push({
				role: "assistant",
				content: message.content.text || null,
				...(message.content.toolCalls?.length ? { tool_calls: message.content.toolCalls } : {}),
			});
		} else if (message.content.result !== null) {
			out.push({
				role: "tool",
				tool_call_id: message.content.callId,
				content: message.content.result,
			});
		}
	}
	return out;
}

/** The conversation as the app shows it: each user message, then the answer it got. */
export function toThreadMessages(
	stored: readonly StoredMessage[],
	createdAt: string,
): ThreadMessage[] {
	const out: ThreadMessage[] = [];
	let answer: ThreadMessage | null = null;
	for (const message of stored) {
		if (message.role === "user") {
			answer = null;
			out.push({
				id: message.id,
				role: "user",
				text: message.content.text,
				cards: [],
				steps: [],
				createdAt,
			});
			continue;
		}
		if (!answer) {
			answer = { id: message.id, role: "assistant", text: "", cards: [], steps: [], createdAt };
			out.push(answer);
		}
		if (message.role === "assistant") {
			if (message.content.text)
				answer.text = [answer.text, message.content.text].filter(Boolean).join("\n\n");
		} else {
			const status: StepStatus =
				message.content.status === "failed"
					? "failed"
					: message.content.status === "pending" || message.content.status === "approved"
						? "running"
						: "done";
			answer.steps.push({ callId: message.content.callId, label: message.content.label, status });
			answer.cards.push(...message.content.cards);
		}
	}
	return out;
}

export type Memory = { id: string; text: string; createdAt: string };

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
	const answers = (user?.answers ?? {}) as { name?: unknown; modules?: unknown };
	const name =
		user?.name ??
		(typeof answers.name === "string" && answers.name.trim() ? answers.name.trim() : null);
	const modules = Array.isArray(answers.modules)
		? answers.modules.filter((id): id is string => typeof id === "string")
		: [];
	return { name, modules };
}
