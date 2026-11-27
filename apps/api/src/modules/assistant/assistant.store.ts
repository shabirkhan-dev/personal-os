import type { AssistantStore, ThreadStore } from "@personal-os/ai";

import type { Database } from "@/db/client";
import { getRecord, listRecords, putRecord } from "./assistant.records";
import {
	addMemory,
	addMessage,
	deleteMemories,
	listMemories,
	loadMessages,
	loadProfile,
	updateTool,
} from "./assistant.repository";

/** The assistant's stores for a signed-in account: synced records and threads in Postgres. */
export function serverStores(
	db: Database,
	userId: string,
): { store: AssistantStore; threads: ThreadStore } {
	return {
		store: {
			list: (collection, parse) => listRecords(db, userId, collection, parse),
			get: (collection, id, parse) => getRecord(db, userId, collection, id, parse),
			put: (collection, id, data, at, deleted) =>
				putRecord(db, userId, collection, id, data, at, deleted),
			memories: () => listMemories(db, userId),
			addMemory: (text) => addMemory(db, userId, text),
			removeMemories: (ids) => deleteMemories(db, userId, ids),
			profile: () => loadProfile(db, userId),
		},
		threads: {
			addMessage: (threadId, message) => addMessage(db, threadId, message),
			updateTool: (messageId, content) => updateTool(db, messageId, content),
			loadMessages: (threadId) => loadMessages(db, threadId),
		},
	};
}
