import {
	AiError,
	type AiConfig,
	AssistantError as AgentError,
	type AssistantStore,
	decide,
	expirePending,
	type Memory,
	type NewMessage,
	runTurn,
	type StoredMessage,
	type ThreadStore,
	threadTitle,
	type ToolContent,
	toThreadMessages,
	undo,
} from "@personal-os/ai";
import type {
	AssistantContext,
	AssistantEvent,
	ThreadMessage,
	ThreadSummary,
} from "@personal-os/domain/assistant";
import { newId } from "@/lib/day";
import type { RecordStore } from "@/lib/db/record-store";

/**
 * The assistant running entirely on the phone with the person's own AI key: the same agent and
 * tools as the server, reading and writing the phone's encrypted records. Threads, messages and
 * memories are records too, so they live on the phone, go into backups, and sync only if the
 * person signs in. No account or server is involved.
 */

export const THREADS = "assistant-threads";
export const MESSAGES = "assistant-messages";
export const MEMORIES = "assistant-memories";

type ThreadRow = { id: string; title: string; createdAt: string; updatedAt: string };
type MessageRow = StoredMessage & { threadId: string; seq: number; createdAt: string };

const isObject = (raw: unknown): raw is Record<string, unknown> =>
	typeof raw === "object" && raw !== null && !Array.isArray(raw);

export function parseThread(raw: unknown): ThreadRow | null {
	if (!isObject(raw) || typeof raw.id !== "string" || typeof raw.title !== "string") return null;
	const createdAt = typeof raw.createdAt === "string" ? raw.createdAt : new Date(0).toISOString();
	const updatedAt = typeof raw.updatedAt === "string" ? raw.updatedAt : createdAt;
	return { id: raw.id, title: raw.title, createdAt, updatedAt };
}

export function parseMessage(raw: unknown): MessageRow | null {
	if (!isObject(raw) || typeof raw.id !== "string" || typeof raw.threadId !== "string") return null;
	if (raw.role !== "user" && raw.role !== "assistant" && raw.role !== "tool") return null;
	if (!isObject(raw.content) || typeof raw.seq !== "number") return null;
	return raw as unknown as MessageRow;
}

function parseMemory(raw: unknown): Memory | null {
	if (!isObject(raw) || typeof raw.id !== "string" || typeof raw.text !== "string") return null;
	return {
		id: raw.id,
		text: raw.text,
		createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date(0).toISOString(),
	};
}

async function listParsed<T>(
	records: RecordStore,
	collection: string,
	parse: (raw: unknown) => T | null,
): Promise<T[]> {
	const out: T[] = [];
	for (const raw of await records.list(collection)) {
		const item = parse(raw);
		if (item) out.push(item);
	}
	return out;
}

/** Message order within a thread, increasing even within one millisecond. */
let lastSeq = 0;
function nextSeq(): number {
	lastSeq = Math.max(Date.now(), lastSeq + 1);
	return lastSeq;
}

export type ProfileSource = () => { name: string; modules: string[]; answers: object };

/** The agent's stores over the phone's record store. */
export function localStores(
	records: RecordStore,
	profile: ProfileSource,
): { store: AssistantStore; threads: ThreadStore } {
	const messagesOf = async (threadId: string) =>
		(await listParsed(records, MESSAGES, parseMessage))
			.filter((message) => message.threadId === threadId)
			.sort((a, b) => a.seq - b.seq);

	return {
		store: {
			list: (collection, parse) => listParsed(records, collection, parse),
			get: async (collection, id, parse) => {
				const raw = await records.get(collection, id);
				return raw === null ? null : parse(raw);
			},
			put: async (collection, id, data, _at, deleted) => {
				if (deleted) await records.remove(collection, id);
				else await records.put(collection, id, data);
				return true;
			},
			memories: async () =>
				(await listParsed(records, MEMORIES, parseMemory)).sort((a, b) =>
					a.createdAt.localeCompare(b.createdAt),
				),
			addMemory: async (text) => {
				const id = newId();
				await records.put(MEMORIES, id, { id, text, createdAt: new Date().toISOString() });
				return id;
			},
			removeMemories: async (ids) => {
				const known = new Set(
					(await listParsed(records, MEMORIES, parseMemory)).map((memory) => memory.id),
				);
				const gone = ids.filter((id) => known.has(id));
				await records.applyLocal(
					[],
					gone.map((id) => ({ collection: MEMORIES, id })),
				);
				return gone.length;
			},
			profile: async () => {
				const { name, modules, answers } = profile();
				return {
					name: name.trim() || null,
					modules,
					answers: answers as Record<string, unknown>,
				};
			},
		},
		threads: {
			addMessage: async (threadId, message: NewMessage) => {
				const id = newId();
				const at = new Date().toISOString();
				await records.put(MESSAGES, id, {
					...message,
					id,
					threadId,
					seq: nextSeq(),
					createdAt: at,
				});
				const thread = parseThread(await records.get(THREADS, threadId));
				if (thread) await records.put(THREADS, threadId, { ...thread, updatedAt: at });
				return id;
			},
			updateTool: async (messageId, content: ToolContent) => {
				const message = parseMessage(await records.get(MESSAGES, messageId));
				if (message) await records.put(MESSAGES, messageId, { ...message, content });
			},
			loadMessages: messagesOf,
		},
	};
}

/** Finds the tool call a card belongs to, in any thread. */
async function findToolCall(records: RecordStore, callId: string) {
	const found = (await listParsed(records, MESSAGES, parseMessage)).find(
		(message) => message.role === "tool" && message.content.callId === callId,
	);
	return found?.role === "tool"
		? { id: found.id, threadId: found.threadId, content: found.content }
		: null;
}

type Emit = (event: AssistantEvent) => void;

export type LocalAssistantDeps = {
	records: RecordStore;
	config: AiConfig;
	profile: ProfileSource;
	/** A fetch that streams reply bodies (Expo's on a phone), stopped early by `stop`. */
	streaming?: (stop?: AbortSignal) => typeof fetch;
};

/** Runs agent work, turning its failures into an error event the chat shows. */
async function guarded(emit: Emit, work: () => Promise<void>): Promise<void> {
	try {
		await work();
	} catch (error) {
		console.warn("[assistant] on-device turn failed", error);
		emit({ type: "error", code: "ASSISTANT_LOCAL_FAILED", message: localErrorMessage(error) });
		emit({ type: "done", changed: [], waiting: false });
	}
}

/** The same operations as the server's assistant API, answered on the phone. */
export const localAssistant = {
	send: async (
		deps: LocalAssistantDeps,
		input: { threadId: string | null; text: string; context: AssistantContext },
		emit: Emit,
		signal?: AbortSignal,
	) => {
		const { store, threads } = localStores(deps.records, deps.profile);
		const fetcher = deps.streaming?.(signal);
		const ctx = { store, now: new Date(), context: input.context };
		await guarded(emit, async () => {
			let threadId = input.threadId;
			const title = threadTitle(input.text);
			const existing = threadId ? parseThread(await deps.records.get(THREADS, threadId)) : null;
			if (threadId && existing) {
				await expirePending(threads, threadId);
			} else {
				threadId = newId();
				const at = new Date().toISOString();
				await deps.records.put(THREADS, threadId, {
					id: threadId,
					title,
					createdAt: at,
					updatedAt: at,
				});
			}
			emit({ type: "thread", threadId, title: existing?.title ?? title });
			await threads.addMessage(threadId, {
				role: "user",
				content: { text: input.text, context: input.context },
			});
			await runTurn({ config: deps.config, ctx, threadId, threads, fetcher }, async (event) =>
				emit(event),
			);
		});
	},

	decide: async (
		deps: LocalAssistantDeps,
		input: { callId: string; approve: boolean; timeZone: string },
		emit: Emit,
	) => {
		const { store, threads } = localStores(deps.records, deps.profile);
		await guarded(emit, async () => {
			const found = await findToolCall(deps.records, input.callId);
			if (!found) throw new AgentError("nothing_to_approve");
			const ctx = { store, now: new Date(), context: { timeZone: input.timeZone } };
			await decide(
				{
					config: deps.config,
					ctx,
					threadId: found.threadId,
					threads,
					fetcher: deps.streaming?.(),
				},
				input.callId,
				input.approve,
				async (event) => emit(event),
			);
		});
	},

	undo: async (deps: LocalAssistantDeps, callId: string, timeZone: string) => {
		const { store, threads } = localStores(deps.records, deps.profile);
		const found = await findToolCall(deps.records, callId);
		if (!found) throw new AgentError("nothing_to_undo");
		const ctx = { store, now: new Date(), context: { timeZone } };
		return undo(ctx, threads, callId, found);
	},

	threads: async (records: RecordStore): Promise<ThreadSummary[]> =>
		(await listParsed(records, THREADS, parseThread))
			.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
			.slice(0, 50)
			.map(({ id, title, updatedAt }) => ({ id, title, updatedAt })),

	thread: async (
		records: RecordStore,
		id: string,
	): Promise<{ id: string; title: string; messages: ThreadMessage[] } | null> => {
		const thread = parseThread(await records.get(THREADS, id));
		if (!thread) return null;
		const stored = (await listParsed(records, MESSAGES, parseMessage))
			.filter((message) => message.threadId === id)
			.sort((a, b) => a.seq - b.seq);
		return { id, title: thread.title, messages: toThreadMessages(stored, thread.createdAt) };
	},

	deleteThread: async (records: RecordStore, id: string) => {
		const messages = (await listParsed(records, MESSAGES, parseMessage)).filter(
			(message) => message.threadId === id,
		);
		await records.applyLocal(
			[],
			[
				{ collection: THREADS, id },
				...messages.map((message) => ({ collection: MESSAGES, id: message.id })),
			],
		);
	},

	memories: async (records: RecordStore) =>
		(await listParsed(records, MEMORIES, parseMemory)).sort((a, b) =>
			a.createdAt.localeCompare(b.createdAt),
		),

	forget: (records: RecordStore, id: string) => records.remove(MEMORIES, id),
};

/** One sentence for a failure of the on-device assistant. */
export function localErrorMessage(error: unknown): string {
	if (error instanceof AgentError) {
		return error.code === "nothing_to_approve"
			? "That change was already answered."
			: "There's nothing left to undo there.";
	}
	if (error instanceof AiError) {
		switch (error.code) {
			case "unauthorized":
				return "Your AI provider refused the key. Check it in Profile → AI key.";
			case "rate_limited":
				return "Your AI provider is busy or out of free requests. Try again in a minute.";
			case "invalid_output":
				return "The model's answer couldn't be read. Try again, or pick another model.";
			default:
				return "Couldn't reach your AI provider. Check your connection and try again.";
		}
	}
	return "The assistant couldn't answer just now. Try again.";
}
