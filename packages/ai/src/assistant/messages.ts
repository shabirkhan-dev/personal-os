import type { StepStatus, ThreadMessage } from "@personal-os/domain/assistant";
import type { ModelMessage } from "./provider";
import type { StoredMessage } from "./store";

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
