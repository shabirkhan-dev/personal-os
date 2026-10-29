import type { AssistantEvent } from "@personal-os/domain/assistant";
import { parseApplication } from "@personal-os/domain/career";
import { and, eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";

import { syncRecords } from "@/db/schema";
import { zonedToDate } from "@/modules/assistant/assistant.time";
import { db, signIn, testApp, testEnv } from "./support";

const mockEnv = testEnv();
const realEnv = testEnv({
	AI_PROVIDER: "openai_compatible",
	OPENAI_API_KEY: "sk-test",
	OPENAI_MODEL: "deepseek-test",
});
const mock = testApp(mockEnv);
const real = testApp(realEnv);

afterEach(() => vi.unstubAllGlobals());

/** Posts to a streaming route and reads every event it sends. */
async function events(
	target: ReturnType<typeof testApp>,
	env: Record<string, unknown>,
	path: string,
	token: string,
	body: unknown,
): Promise<AssistantEvent[]> {
	const response = await target.app.request(
		`/api/v1${path}`,
		{
			method: "POST",
			headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
			body: JSON.stringify(body),
		},
		env,
	);
	expect(response.status).toBe(200);
	const text = await response.text();
	return text
		.split("\n")
		.filter((line) => line.startsWith("data:"))
		.map((line) => JSON.parse(line.slice(5)) as AssistantEvent);
}

/** A provider answer as a server-sent stream, in OpenAI's chunk format. */
function sse(chunks: unknown[]): Response {
	const body = [
		...chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`),
		"data: [DONE]\n\n",
	].join("");
	return new Response(body, { status: 200, headers: { "Content-Type": "text/event-stream" } });
}

const textChunk = (content: string) => ({ choices: [{ delta: { content } }] });
const toolChunk = (id: string, name: string, args: unknown) => {
	const json = JSON.stringify(args);
	const half = Math.floor(json.length / 2);
	// Arguments arrive in pieces, as real providers send them.
	return [
		{
			choices: [
				{
					delta: {
						tool_calls: [{ index: 0, id, function: { name, arguments: json.slice(0, half) } }],
					},
				},
			],
		},
		{
			choices: [
				{ delta: { tool_calls: [{ index: 0, function: { arguments: json.slice(half) } }] } },
			],
		},
	];
};

/** Stubs the provider with one streamed answer per model call, in order. */
function provider(...answers: unknown[][]) {
	const spy = vi.fn(async () =>
		sse(answers[Math.min(spy.mock.calls.length - 1, answers.length - 1)] ?? []),
	);
	vi.stubGlobal("fetch", spy);
	return spy;
}

const context = { timeZone: "Asia/Karachi", module: "career" };

describe("assistant with the mock model", () => {
	it("starts a thread, reads the job hunt with a tool and answers", async () => {
		const session = await signIn(mock.call);
		const got = await events(mock, mockEnv, "/assistant/messages", session.accessToken, {
			text: "How's my job hunt going?",
			context,
		});
		expect(got[0]).toMatchObject({ type: "thread", title: "How's my job hunt going?" });
		expect(got).toContainEqual({
			type: "step",
			callId: expect.any(String),
			label: "Checking your job hunt",
			status: "done",
		});
		expect(got.some((event) => event.type === "card" && event.card.kind === "stats")).toBe(true);
		expect(got.at(-1)).toEqual({ type: "done", changed: [], waiting: false });

		const threads = await mock.call<{ data: { id: string; title: string }[] }>(
			"GET",
			"/assistant/threads",
			{ token: session.accessToken },
		);
		const thread = threads.json?.data[0];
		expect(thread?.title).toBe("How's my job hunt going?");
		const opened = await mock.call<{ data: { messages: { role: string; text: string }[] } }>(
			"GET",
			`/assistant/threads/${thread?.id}`,
			{ token: session.accessToken },
		);
		expect(opened.json?.data.messages.map((message) => message.role)).toEqual([
			"user",
			"assistant",
		]);
	});

	it("keeps each person's threads private", async () => {
		const owner = await signIn(mock.call);
		const other = await signIn(mock.call);
		const got = await events(mock, mockEnv, "/assistant/messages", owner.accessToken, {
			text: "hi",
			context,
		});
		const threadId = got[0]?.type === "thread" ? got[0].threadId : "";
		expect(
			(await mock.call("GET", `/assistant/threads/${threadId}`, { token: other.accessToken }))
				.status,
		).toBe(404);
		const intruding = await events(mock, mockEnv, "/assistant/messages", other.accessToken, {
			threadId,
			text: "hi",
			context,
		});
		expect(intruding.at(-1)).toMatchObject({ type: "error", code: "ASSISTANT_THREAD_NOT_FOUND" });
	});
});

describe("assistant with a tool-calling model", () => {
	it("asks before adding, adds once approved, syncs it to the phone and undoes it", async () => {
		const session = await signIn(real.call);
		const spy = provider(
			[
				textChunk("Adding it."),
				...toolChunk("call_add", "add_application", {
					company: "Tessera",
					role: "Senior TypeScript",
					stage: "applied",
					pay: "Rs 500k",
				}),
			],
			[textChunk("Added **Tessera**; I'll remind you to follow up next week.")],
		);

		const asked = await events(real, realEnv, "/assistant/messages", session.accessToken, {
			text: "I applied to Tessera for senior typescript, 500k",
			context,
		});
		const approval = asked.find((event) => event.type === "card" && event.card.kind === "approval");
		expect(approval).toMatchObject({
			card: { callId: "call_add", title: "Add Tessera", state: "waiting", effect: "write" },
		});
		expect(asked.at(-1)).toEqual({ type: "done", changed: [], waiting: true });

		// The model got the tools and the person's context.
		const sent = JSON.parse((spy.mock.calls[0] as unknown as [string, { body: string }])[1].body);
		expect(sent.stream).toBe(true);
		expect(sent.tools.map((tool: { function: { name: string } }) => tool.function.name)).toContain(
			"add_application",
		);
		expect(sent.messages[0].content).toContain("Asia/Karachi");

		const approved = await events(real, realEnv, "/assistant/approvals", session.accessToken, {
			callId: "call_add",
			approve: true,
			timeZone: "Asia/Karachi",
		});
		expect(approved).toContainEqual(
			expect.objectContaining({
				type: "card",
				card: expect.objectContaining({ kind: "change", title: "Add Tessera" }),
			}),
		);
		expect(approved.at(-1)).toEqual({
			type: "done",
			changed: ["career-applications"],
			waiting: false,
		});

		const [row] = await db
			.select()
			.from(syncRecords)
			.where(
				and(
					eq(syncRecords.userId, session.user.id),
					eq(syncRecords.collection, "career-applications"),
				),
			);
		const app = parseApplication(row?.data);
		expect(app).toMatchObject({
			company: "Tessera",
			role: "Senior TypeScript",
			stage: "applied",
			pay: "Rs 500k",
		});
		expect(app?.followUpAt).not.toBeNull();

		const pulled = await real.call<{ data: { changes: { collection: string }[] } }>(
			"POST",
			"/sync",
			{
				token: session.accessToken,
				body: { cursor: null, changes: [] },
			},
		);
		expect(pulled.json?.data.changes.map((change) => change.collection)).toContain(
			"career-applications",
		);

		const undone = await real.call<{ data: { changed: string[] } }>("POST", "/assistant/undo", {
			token: session.accessToken,
			body: { callId: "call_add" },
		});
		expect(undone.json?.data.changed).toEqual(["career-applications"]);
		const [after] = await db
			.select({ deletedAt: syncRecords.deletedAt })
			.from(syncRecords)
			.where(and(eq(syncRecords.userId, session.user.id), eq(syncRecords.id, app?.id ?? "")));
		expect(after?.deletedAt).not.toBeNull();
		expect(
			(
				await real.call("POST", "/assistant/undo", {
					token: session.accessToken,
					body: { callId: "call_add" },
				})
			).status,
		).toBe(409);
	});

	it("tells the model when the person declines, and changes nothing", async () => {
		const session = await signIn(real.call);
		const spy = provider(
			[
				...toolChunk("call_no", "add_application", {
					company: "Acme",
					role: "Dev",
					stage: "saved",
				}),
			],
			[textChunk("Okay, I left it.")],
		);
		await events(real, realEnv, "/assistant/messages", session.accessToken, {
			text: "save acme dev",
			context,
		});
		const declined = await events(real, realEnv, "/assistant/approvals", session.accessToken, {
			callId: "call_no",
			approve: false,
			timeZone: "Asia/Karachi",
		});
		expect(declined.at(-1)).toEqual({ type: "done", changed: [], waiting: false });
		const second = JSON.parse((spy.mock.calls[1] as unknown as [string, { body: string }])[1].body);
		expect(second.messages.at(-1)).toMatchObject({ role: "tool", tool_call_id: "call_no" });
		expect(second.messages.at(-1).content).toContain("declined");
		const rows = await db.select().from(syncRecords).where(eq(syncRecords.userId, session.user.id));
		expect(rows).toEqual([]);
	});

	it("hands a bad tool input back to the model to fix", async () => {
		const session = await signIn(real.call);
		const spy = provider(
			[...toolChunk("call_bad", "find_applications", { limit: 500 })],
			[textChunk("Fixed.")],
		);
		const got = await events(real, realEnv, "/assistant/messages", session.accessToken, {
			text: "list jobs",
			context,
		});
		expect(got.at(-1)).toMatchObject({ type: "done", waiting: false });
		const second = JSON.parse((spy.mock.calls[1] as unknown as [string, { body: string }])[1].body);
		expect(second.messages.at(-1).content).toContain("Invalid input");
	});
});

describe("assistant time", () => {
	it("reads a local time in the person's zone", () => {
		expect(zonedToDate("2026-11-02T15:00", "Asia/Karachi")?.toISOString()).toBe(
			"2026-11-02T10:00:00.000Z",
		);
		expect(zonedToDate("2026-11-02", "UTC")?.toISOString()).toBe("2026-11-02T09:00:00.000Z");
		expect(zonedToDate("tomorrow", "UTC")).toBeNull();
	});
});
