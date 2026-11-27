import type { AssistantContext, Card } from "@personal-os/domain/assistant";
import type { ModelToolCall } from "./provider";

/**
 * Where the assistant reads and writes: the person's records, its memory of them and their
 * profile. The server implements it over Postgres for signed-in accounts; the phone implements it
 * over its own encrypted database when the person uses their own AI key, so the whole chat runs
 * without any server.
 */
export type AssistantStore = {
	/** Every live record of one collection, read through `parse` (unreadable ones are skipped). */
	list<T>(collection: string, parse: (raw: unknown) => T | null): Promise<T[]>;
	get<T>(collection: string, id: string, parse: (raw: unknown) => T | null): Promise<T | null>;
	/** Saves a record, or removes it with `deleted`. `at` orders writes (milliseconds). */
	put(
		collection: string,
		id: string,
		data: unknown,
		at: number,
		deleted?: boolean,
	): Promise<boolean>;
	/** The assistant's notebook about the person, oldest first. */
	memories(): Promise<Memory[]>;
	addMemory(text: string): Promise<string>;
	removeMemories(ids: readonly string[]): Promise<number>;
	/** The name, modules and setup answers the person gave at onboarding. */
	profile(): Promise<Profile>;
};

export type Memory = { id: string; text: string; createdAt: string };

export type Profile = { name: string | null; modules: string[]; answers: Record<string, unknown> };

/** How a turn is stored: the model's messages plus what the app shows for them. */
export type UserContent = { text: string; context?: AssistantContext };
export type AssistantContent = { text: string; toolCalls?: ModelToolCall[] };
export type ToolStatus = "pending" | "approved" | "declined" | "done" | "failed";

/** A record as it was before a tool changed it; `previous: null` means the tool created it. */
export type UndoWrite = { collection: string; id: string; previous: unknown };

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

export type NewMessage =
	| { role: "user"; content: UserContent }
	| { role: "assistant"; content: AssistantContent }
	| { role: "tool"; content: ToolContent };

/** A thread's messages, wherever they're kept. */
export type ThreadStore = {
	addMessage(threadId: string, message: NewMessage): Promise<string>;
	updateTool(messageId: string, content: ToolContent): Promise<void>;
	loadMessages(threadId: string): Promise<StoredMessage[]>;
};

/** Why a turn couldn't go on, for the caller to word: the server as API errors, the phone as text. */
export class AssistantError extends Error {
	constructor(readonly code: "nothing_to_approve" | "nothing_to_undo") {
		super(code);
		this.name = "AssistantError";
	}
}
