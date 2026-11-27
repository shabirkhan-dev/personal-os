import type {
	AssistantContext,
	AssistantEvent,
	ThreadMessage,
	ThreadSummary,
} from "@personal-os/domain/assistant";
import { fetch as streamingFetch } from "expo/fetch";
import { useEffect, useMemo } from "react";
import { ownAiConfig, useOwnAi } from "@/lib/ai/own-ai";
import { getRecordStore } from "@/lib/db/database";
import { useAuth } from "@/modules/auth";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { assistantApi } from "../services/assistant-api";
import { type LocalAssistantDeps, localAssistant } from "../services/local-assistant";

type Emit = (event: AssistantEvent) => void;

/** Where the assistant runs, with the same operations either way. */
export type AssistantBackend = {
	/** "device": the person's own key, straight from the phone; "server": their account. */
	where: "device" | "server";
	/** Identifies the backend for cached queries, so switching refreshes the lists. */
	key: string;
	send: (
		input: { threadId: string | null; text: string; context: AssistantContext },
		emit: Emit,
		signal?: AbortSignal,
	) => Promise<void>;
	decide: (
		input: { callId: string; approve: boolean; timeZone: string },
		emit: Emit,
	) => Promise<void>;
	undo: (callId: string, timeZone: string) => Promise<{ changed: string[] }>;
	threads: () => Promise<ThreadSummary[]>;
	thread: (id: string) => Promise<{ id: string; title: string; messages: ThreadMessage[] } | null>;
	deleteThread: (id: string) => Promise<void>;
	memories: () => Promise<{ id: string; text: string; createdAt: string }[]>;
	forget: (id: string) => Promise<void>;
};

/** Either signal aborting aborts the request: the provider's timeout, or the person's Stop. */
function eitherSignal(a?: AbortSignal | null, b?: AbortSignal | null): AbortSignal | undefined {
	if (!a || !b) return a ?? b ?? undefined;
	const controller = new AbortController();
	const abort = () => controller.abort();
	if (a.aborted || b.aborted) abort();
	a.addEventListener("abort", abort);
	b.addEventListener("abort", abort);
	return controller.signal;
}

/** Expo's fetch, which streams the reply body on Android and iOS. */
function streamingWith(stop?: AbortSignal): typeof fetch {
	return ((url: string, init?: RequestInit) =>
		streamingFetch(url, {
			method: init?.method,
			headers: init?.headers as Record<string, string>,
			body: init?.body as string,
			signal: eitherSignal(init?.signal, stop),
		})) as unknown as typeof fetch;
}

/** What the person told onboarding, for the assistant's picture of them. */
const profile = () => {
	const state = useOnboardingStore.getState();
	return { name: state.name, modules: [...state.modules], answers: state };
};

/**
 * The assistant's backend: the phone itself when the person has their own AI key (no account,
 * no server), otherwise their signed-in account. Null when neither is set up.
 */
export function useAssistantBackend(): AssistantBackend | null {
	const { token, status } = useAuth();
	const { own, hydrated, hydrate } = useOwnAi();
	useEffect(() => {
		if (!hydrated)
			hydrate().catch((error: unknown) => console.warn("[assistant] key hydrate failed", error));
	}, [hydrated, hydrate]);
	const signedIn = status === "signed-in" && token !== null;

	return useMemo<AssistantBackend | null>(() => {
		if (own) {
			const config = ownAiConfig(own);
			const deps = async (): Promise<LocalAssistantDeps> => ({
				records: await getRecordStore(),
				config,
				profile,
				streaming: streamingWith,
			});
			return {
				where: "device",
				key: `device:${own.provider}:${own.model}`,
				send: async (input, emit, signal) => localAssistant.send(await deps(), input, emit, signal),
				decide: async (input, emit) => localAssistant.decide(await deps(), input, emit),
				undo: async (callId, timeZone) => localAssistant.undo(await deps(), callId, timeZone),
				threads: async () => localAssistant.threads(await getRecordStore()),
				thread: async (id) => localAssistant.thread(await getRecordStore(), id),
				deleteThread: async (id) => localAssistant.deleteThread(await getRecordStore(), id),
				memories: async () => localAssistant.memories(await getRecordStore()),
				forget: async (id) => localAssistant.forget(await getRecordStore(), id),
			};
		}
		if (!signedIn || !token) return null;
		return {
			where: "server",
			key: "server",
			send: (input, emit, signal) => assistantApi.send(token, input, emit, signal),
			decide: (input, emit) => assistantApi.decide(token, input, emit),
			undo: (callId) => assistantApi.undo(token, callId),
			threads: () => assistantApi.threads(token),
			thread: (id) => assistantApi.thread(token, id),
			deleteThread: (id) => assistantApi.deleteThread(token, id),
			memories: () => assistantApi.memories(token),
			forget: (id) => assistantApi.forget(token, id),
		};
	}, [own, signedIn, token]);
}
