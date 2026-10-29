import type { AssistantContext, AssistantEvent } from "@personal-os/domain/assistant";
import { useCallback, useMemo } from "react";
import { create } from "zustand";
import { useSync } from "@/lib/sync/sync-provider";
import { useAuth } from "@/modules/auth";
import {
	applyEvent,
	type Conversation,
	continueTurn,
	emptyConversation,
	startTurn,
} from "../lib/conversation";
import { assistantApi, assistantErrorMessage, deviceTimeZone } from "../services/assistant-api";

export type AssistantStatus = "idle" | "thinking" | "waiting";

/** Where the assistant was opened from, without the time zone (the phone adds it). */
export type AssistantPlace = Omit<AssistantContext, "timeZone">;

type State = {
	conversation: Conversation;
	status: AssistantStatus;
	error: string | null;
	place: AssistantPlace;
};

/** One conversation at a time, shared by the chat screen and the in-screen assistant. */
const useAssistantStore = create<State>(() => ({
	conversation: emptyConversation,
	status: "idle",
	error: null,
	place: {},
}));

let controller: AbortController | null = null;

function apply(event: AssistantEvent) {
	useAssistantStore.setState((state) => ({
		conversation: applyEvent(state.conversation, event),
		...(event.type === "error" ? { error: event.message } : {}),
		...(event.type === "done" ? { status: event.waiting ? "waiting" : "idle" } : {}),
	}));
}

/**
 * The assistant for screens: the conversation, its status, and sending, approving and undoing.
 * Changes the assistant makes are synced to the phone as soon as an answer finishes.
 */
export function useAssistant() {
	const { token, status: auth } = useAuth();
	const { syncNow } = useSync();
	const state = useAssistantStore();

	const run = useCallback(
		async (work: (token: string, emit: (event: AssistantEvent) => void) => Promise<void>) => {
			if (auth !== "signed-in" || !token) {
				useAssistantStore.setState({ status: "idle", error: "Sign in to use the assistant." });
				return;
			}
			let changed = false;
			useAssistantStore.setState({ status: "thinking", error: null });
			try {
				await work(token, (event) => {
					if (event.type === "done" && event.changed.length > 0) changed = true;
					apply(event);
				});
			} catch (error) {
				useAssistantStore.setState({ error: assistantErrorMessage(error) });
			} finally {
				useAssistantStore.setState((current) => ({
					status: current.status === "thinking" ? "idle" : current.status,
				}));
				if (changed)
					syncNow().catch((error: unknown) =>
						console.warn("[assistant] sync after a change failed", error),
					);
			}
		},
		[auth, token, syncNow],
	);

	const send = useCallback(
		(text: string) => {
			const line = text.trim();
			if (!line || useAssistantStore.getState().status === "thinking") return;
			const { conversation, place } = useAssistantStore.getState();
			useAssistantStore.setState({ conversation: startTurn(conversation, line) });
			controller?.abort();
			controller = new AbortController();
			const signal = controller.signal;
			void run((accessToken, emit) =>
				assistantApi.send(
					accessToken,
					{
						threadId: conversation.threadId,
						text: line,
						context: { ...place, timeZone: deviceTimeZone() },
					},
					emit,
					signal,
				),
			);
		},
		[run],
	);

	const decide = useCallback(
		(callId: string, approve: boolean) => {
			useAssistantStore.setState((current) => ({
				conversation: continueTurn(current.conversation),
			}));
			void run((accessToken, emit) =>
				assistantApi.decide(accessToken, { callId, approve, timeZone: deviceTimeZone() }, emit),
			);
		},
		[run],
	);

	const undo = useCallback(
		async (callId: string) => {
			if (!token) return;
			try {
				const result = await assistantApi.undo(token, callId);
				useAssistantStore.setState((current) => ({
					conversation: {
						...current.conversation,
						messages: current.conversation.messages.map((message) =>
							Object.assign({}, message, {
								cards: message.cards.map((card) =>
									card.kind === "change" && card.callId === callId
										? Object.assign({}, card, { undone: true })
										: card,
								),
							}),
						),
					},
				}));
				if (result.changed.length > 0) await syncNow();
			} catch (error) {
				useAssistantStore.setState({ error: assistantErrorMessage(error) });
			}
		},
		[token, syncNow],
	);

	return useMemo(
		() => ({ ...state, send, decide, undo, available: auth === "signed-in" && token !== null }),
		[state, send, decide, undo, auth, token],
	);
}

/** Opens a fresh conversation about `place` (the screen the person is on). */
export function startConversation(place: AssistantPlace = {}) {
	controller?.abort();
	controller = null;
	useAssistantStore.setState({
		conversation: emptyConversation,
		status: "idle",
		error: null,
		place,
	});
}

/** Shows a saved conversation. */
export function showConversation(conversation: Conversation) {
	controller?.abort();
	controller = null;
	useAssistantStore.setState({ conversation, status: "idle", error: null, place: {} });
}

/**
 * Gets the assistant ready for `place`: the conversation already about it carries on; anywhere
 * else starts fresh, so "this" always means what is on screen.
 */
export function prepareFor(place: AssistantPlace) {
	const current = useAssistantStore.getState().place;
	const same =
		current.module === place.module &&
		current.screen === place.screen &&
		current.recordId === place.recordId;
	if (!same) startConversation(place);
}
