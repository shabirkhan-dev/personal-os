import { createDocumentStore } from "@/lib/storage/document-store";
import { asBoolean, isRecord } from "@/lib/storage/parse";

/**
 * The person's photo on this phone. It shows at once and offline; `pending` stays true until the
 * same photo has been uploaded to the account, so it is retried when the app is online again.
 */
export type AvatarDoc = { uri: string | null; pending: boolean };

const initial: AvatarDoc = { uri: null, pending: false };

export function parseAvatar(raw: unknown): AvatarDoc {
	if (!isRecord(raw)) return initial;
	const uri = typeof raw.uri === "string" && raw.uri.startsWith("file://") ? raw.uri : null;
	return { uri, pending: uri !== null && asBoolean(raw.pending, false) };
}

export const useAvatarStore = createDocumentStore("profile-avatar", initial, parseAvatar);
