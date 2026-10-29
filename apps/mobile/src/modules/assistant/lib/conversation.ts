import type { AssistantEvent, Card, ThreadMessage } from "@personal-os/domain/assistant";

/** The conversation on screen; the streamed events update its last answer. */
export type Conversation = {
	threadId: string | null;
	title: string;
	messages: ThreadMessage[];
};

export const emptyConversation: Conversation = { threadId: null, title: "New chat", messages: [] };

let localId = 0;
const nextId = (prefix: string) => {
	localId += 1;
	return `${prefix}-${Date.now().toString(36)}-${localId}`;
};

/** The person's message, and an empty answer the stream fills in. */
export function startTurn(
	conversation: Conversation,
	text: string,
	now = new Date(),
): Conversation {
	const createdAt = now.toISOString();
	return {
		...conversation,
		messages: [
			...conversation.messages,
			{ id: nextId("user"), role: "user", text, cards: [], steps: [], createdAt },
			{ id: nextId("answer"), role: "assistant", text: "", cards: [], steps: [], createdAt },
		],
	};
}

/** An answer to fill after an approval: the last answer, or a new one. */
export function continueTurn(conversation: Conversation, now = new Date()): Conversation {
	if (conversation.messages.at(-1)?.role === "assistant") return conversation;
	return {
		...conversation,
		messages: [
			...conversation.messages,
			{
				id: nextId("answer"),
				role: "assistant",
				text: "",
				cards: [],
				steps: [],
				createdAt: now.toISOString(),
			},
		],
	};
}

/** Cards that change state in place (an approval decided, a change undone) share a key. */
function cardKey(card: Card): string | null {
	if (card.kind === "approval" || card.kind === "change") return `${card.kind}:${card.callId}`;
	return null;
}

/** Adds a card, or replaces the card it updates wherever it is in the conversation. */
export function upsertCard(messages: readonly ThreadMessage[], card: Card): ThreadMessage[] {
	const key = cardKey(card);
	if (key) {
		const index = messages.findIndex((message) =>
			message.cards.some((item) => cardKey(item) === key),
		);
		if (index !== -1) {
			return messages.map((message, at) =>
				at === index
					? Object.assign({}, message, {
							cards: message.cards.map((item) => (cardKey(item) === key ? card : item)),
						})
					: message,
			);
		}
	}
	return updateLast(messages, (last) => ({ cards: [...last.cards, card] }));
}

function updateLast(
	messages: readonly ThreadMessage[],
	change: (last: ThreadMessage) => Partial<ThreadMessage>,
): ThreadMessage[] {
	const last = messages.at(-1);
	if (!last || last.role !== "assistant") return [...messages];
	return [...messages.slice(0, -1), Object.assign({}, last, change(last))];
}

/** One streamed event applied to the conversation. */
export function applyEvent(conversation: Conversation, event: AssistantEvent): Conversation {
	switch (event.type) {
		case "thread":
			return {
				...conversation,
				threadId: event.threadId,
				title: conversation.threadId ? conversation.title : event.title,
			};
		case "text":
			return {
				...conversation,
				messages: updateLast(conversation.messages, (last) => ({ text: last.text + event.delta })),
			};
		case "step":
			return {
				...conversation,
				messages: updateLast(conversation.messages, (last) => {
					const known = last.steps.some((step) => step.callId === event.callId);
					const step = { callId: event.callId, label: event.label, status: event.status };
					return {
						steps: known
							? last.steps.map((item) => (item.callId === event.callId ? step : item))
							: [...last.steps, step],
					};
				}),
			};
		case "card":
			return { ...conversation, messages: upsertCard(conversation.messages, event.card) };
		default:
			return conversation;
	}
}

/** The approval cards still waiting for the person. */
export function waitingApprovals(conversation: Conversation) {
	return conversation.messages.flatMap((message) =>
		message.cards.filter(
			(card): card is Extract<Card, { kind: "approval" }> =>
				card.kind === "approval" && card.state === "waiting",
		),
	);
}
