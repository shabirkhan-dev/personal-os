/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import type { AssistantEvent } from "@personal-os/domain/assistant";
import { RecordStore } from "@/lib/db/record-store";
import { memoryDriver } from "@/lib/db/testing/bun-driver";
import { localAssistant, localStores, MEMORIES, MESSAGES, THREADS } from "./local-assistant";

const profile = () => ({ name: "Sara", modules: ["finance"], answers: { weightKg: 60 } });

async function setup() {
	const records = await RecordStore.open(memoryDriver());
	return { records, deps: { records, config: { provider: "mock" as const }, profile } };
}

describe("the assistant on the phone", () => {
	test("answers a question with tools and keeps the chat as records, with no server", async () => {
		const { records, deps } = await setup();
		const events: AssistantEvent[] = [];
		await localAssistant.send(
			deps,
			{
				threadId: null,
				text: "How is my money this month?",
				context: { timeZone: "Asia/Karachi" },
			},
			(event) => events.push(event),
		);

		expect(events.some((event) => event.type === "error")).toBe(false);
		const thread = events.find((event) => event.type === "thread");
		expect(thread?.type === "thread" && thread.title).toBeTruthy();
		expect(events.at(-1)?.type).toBe("done");

		const threads = await localAssistant.threads(records);
		expect(threads).toHaveLength(1);
		const saved = await localAssistant.thread(records, threads[0]?.id ?? "");
		expect(saved?.messages.map((message) => message.role)).toEqual(["user", "assistant"]);
		// Finance is empty on a new phone, so the answer offers to set it up.
		expect(saved?.messages[1]?.cards).toContainEqual({
			kind: "link",
			label: "Set up Finance",
			link: { screen: "finance" },
		});
		expect(saved?.messages[1]?.steps[0]).toMatchObject({
			label: "Checking your money",
			status: "done",
		});
		expect((await records.list(MESSAGES)).length).toBeGreaterThanOrEqual(3);
	});

	test("carries on the same thread", async () => {
		const { records, deps } = await setup();
		let threadId: string | null = null;
		const emit = (event: AssistantEvent) => {
			if (event.type === "thread") threadId = event.threadId;
		};
		const context = { timeZone: "UTC" };
		await localAssistant.send(deps, { threadId: null, text: "my budget?", context }, emit);
		await localAssistant.send(deps, { threadId, text: "and my training?", context }, emit);
		expect(await records.list(THREADS)).toHaveLength(1);
		const saved = await localAssistant.thread(records, threadId ?? "");
		expect(saved?.messages.filter((message) => message.role === "user")).toHaveLength(2);
	});

	test("remembers, forgets and deletes a chat with its messages", async () => {
		const { records, deps } = await setup();
		const { store } = localStores(records, profile);
		const id = await store.addMemory("Prefers runs in the morning");
		expect((await localAssistant.memories(records)).map((memory) => memory.text)).toEqual([
			"Prefers runs in the morning",
		]);
		expect(await store.removeMemories([id, "unknown"])).toBe(1);
		expect(await records.list(MEMORIES)).toHaveLength(0);

		let threadId = "";
		await localAssistant.send(
			deps,
			{ threadId: null, text: "my spending?", context: { timeZone: "UTC" } },
			(event) => {
				if (event.type === "thread") threadId = event.threadId;
			},
		);
		await localAssistant.deleteThread(records, threadId);
		expect(await records.list(THREADS)).toHaveLength(0);
		expect(await records.list(MESSAGES)).toHaveLength(0);
	});

	test("reads the profile from onboarding", async () => {
		const { records } = await setup();
		const { store } = localStores(records, profile);
		expect(await store.profile()).toEqual({
			name: "Sara",
			modules: ["finance"],
			answers: { weightKg: 60 },
		});
	});

	test("an unreachable provider becomes a sentence in the chat, not a crash", async () => {
		const { deps } = await setup();
		const events: AssistantEvent[] = [];
		await localAssistant.send(
			{ ...deps, config: { provider: "off" } },
			{ threadId: null, text: "hi", context: { timeZone: "UTC" } },
			(event) => events.push(event),
		);
		const error = events.find((event) => event.type === "error");
		expect(error?.type === "error" && error.message).toContain("Couldn't reach your AI provider");
		expect(events.at(-1)).toEqual({ type: "done", changed: [], waiting: false });
	});
});
