import { describe, expect, it } from "bun:test";
import type { AssistantEvent } from "@personal-os/domain/assistant";
import { applyEvent, emptyConversation, startTurn, waitingApprovals } from "./conversation";

const play = (events: AssistantEvent[]) =>
	events.reduce(applyEvent, startTurn(emptyConversation, "I applied to Tessera"));

describe("assistant conversation", () => {
	it("streams text, steps and cards into the answer, and takes the new thread", () => {
		const conversation = play([
			{ type: "thread", threadId: "t1", title: "I applied to Tessera" },
			{ type: "text", delta: "Adding " },
			{ type: "text", delta: "it." },
			{ type: "step", callId: "c1", label: "Adding Tessera", status: "running" },
			{ type: "step", callId: "c1", label: "Adding Tessera", status: "done" },
			{
				type: "card",
				card: { kind: "link", label: "Open applications", link: { screen: "career-applications" } },
			},
		]);
		expect(conversation.threadId).toBe("t1");
		const [user, answer] = conversation.messages;
		expect(user).toMatchObject({ role: "user", text: "I applied to Tessera" });
		expect(answer).toMatchObject({
			role: "assistant",
			text: "Adding it.",
			steps: [{ callId: "c1", status: "done" }],
		});
		expect(answer?.cards).toHaveLength(1);
	});

	it("updates an approval in place when it is decided", () => {
		const approval = {
			kind: "approval" as const,
			callId: "c1",
			title: "Add Tessera",
			detail: "Senior TS",
			effect: "write" as const,
			state: "waiting" as const,
		};
		const waiting = play([{ type: "card", card: approval }]);
		expect(waitingApprovals(waiting)).toHaveLength(1);
		const decided = applyEvent(waiting, { type: "card", card: { ...approval, state: "approved" } });
		expect(waitingApprovals(decided)).toEqual([]);
		expect(decided.messages.at(-1)?.cards).toEqual([{ ...approval, state: "approved" }]);
	});

	it("keeps the first title when a thread carries on", () => {
		const first = play([{ type: "thread", threadId: "t1", title: "First" }]);
		const next = applyEvent(startTurn(first, "Second"), {
			type: "thread",
			threadId: "t1",
			title: "Second",
		});
		expect(next.title).toBe("First");
	});
});
