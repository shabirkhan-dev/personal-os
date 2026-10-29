import type { AssistantEvent, Card } from "@personal-os/domain/assistant";
import { parseBill, parseEntry } from "@personal-os/domain/finance";
import { and, eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";

import { syncRecords } from "@/db/schema";
import { localClock } from "@/modules/assistant/assistant.time";
import { db, signIn, testApp, testEnv } from "./support";

const env = testEnv({
	AI_PROVIDER: "openai_compatible",
	OPENAI_API_KEY: "sk-test",
	OPENAI_MODEL: "m",
});
const real = testApp(env);
afterEach(() => vi.unstubAllGlobals());

async function events(path: string, token: string, body: unknown): Promise<AssistantEvent[]> {
	const response = await real.app.request(
		`/api/v1${path}`,
		{
			method: "POST",
			headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
			body: JSON.stringify(body),
		},
		env,
	);
	return (await response.text())
		.split("\n")
		.filter((line) => line.startsWith("data:"))
		.map((line) => JSON.parse(line.slice(5)) as AssistantEvent);
}

const sse = (chunks: unknown[]) =>
	new Response(
		[...chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`), "data: [DONE]\n\n"].join(""),
	);
const call = (id: string, name: string, args: unknown) => ({
	choices: [
		{
			delta: {
				tool_calls: [{ index: 0, id, function: { name, arguments: JSON.stringify(args) } }],
			},
		},
	],
});
const say = (content: string) => ({ choices: [{ delta: { content } }] });

function provider(...answers: unknown[][]) {
	const spy = vi.fn(async () =>
		sse(answers[Math.min(spy.mock.calls.length - 1, answers.length - 1)] ?? []),
	);
	vi.stubGlobal("fetch", spy);
	return spy;
}

/** Puts records on the account as the phone would. */
async function push(token: string, changes: { collection: string; id: string; data: unknown }[]) {
	const now = Date.now();
	await real.call("POST", "/sync", {
		token,
		body: {
			cursor: null,
			changes: changes.map((change) => ({ ...change, updatedAt: now - 1000, deletedAt: null })),
		},
	});
}

const cards = (got: AssistantEvent[]) =>
	got.flatMap((event) => (event.type === "card" ? [event.card] : [])) as Card[];
const context = { timeZone: "Asia/Karachi", module: "finance" };

describe("assistant finance tools", () => {
	it("answers money questions from the person's own numbers", async () => {
		const session = await signIn(real.call);
		const now = new Date();
		await push(session.accessToken, [
			{
				collection: "finance-settings",
				id: "settings",
				data: {
					id: "settings",
					setUp: true,
					balance: 100_000,
					balanceAt: new Date(now.getTime() - 86_400_000).toISOString(),
					monthlyCost: 60_000,
					limits: { food: 20_000 },
				},
			},
			{
				collection: "finance-entries",
				id: "e1",
				data: {
					id: "e1",
					kind: "spend",
					amount: 2_500,
					category: "food",
					title: "Groceries",
					at: new Date(now.getTime() - 3_600_000).toISOString(),
				},
			},
		]);
		provider([call("c1", "finance_overview", {})], [say("You have **Rs 97,500**.")]);
		const got = await events("/assistant/messages", session.accessToken, {
			text: "how am I doing for money",
			context,
		});
		const metric = cards(got).find((card) => card.kind === "metric");
		expect(metric).toMatchObject({ label: "Money now", value: "Rs 97,500" });
		expect(metric?.kind === "metric" && metric.detail).toContain("48 days");
		const progress = cards(got).find((card) => card.kind === "progress");
		expect(
			progress?.kind === "progress" && progress.items.find((item) => item.label === "Food"),
		).toMatchObject({ used: 2_500, limit: 20_000 });
	});

	it("logs spending once approved, on the right line", async () => {
		const session = await signIn(real.call);
		provider(
			[
				call("c2", "log_spending", {
					items: [
						{ amount: 1_200, title: "Lunch", line: "food" },
						{ amount: 450, title: "Rickshaw", line: "transport" },
					],
				}),
			],
			[say("Logged both.")],
		);
		const asked = await events("/assistant/messages", session.accessToken, {
			text: "lunch 1200 and rickshaw 450",
			context,
		});
		expect(cards(asked)[0]).toMatchObject({ kind: "approval", title: "Log Rs 1,650 spent" });
		const done = await events("/assistant/approvals", session.accessToken, {
			callId: "c2",
			approve: true,
			timeZone: "Asia/Karachi",
		});
		expect(done.at(-1)).toEqual({ type: "done", changed: ["finance-entries"], waiting: false });
		const rows = await db
			.select()
			.from(syncRecords)
			.where(
				and(eq(syncRecords.userId, session.user.id), eq(syncRecords.collection, "finance-entries")),
			);
		const entries = rows.map((row) => parseEntry(row.data));
		expect(
			entries.map((entry) => [entry?.title, entry?.category, entry?.amount]).toSorted(),
		).toEqual([
			["Lunch", "food", 1_200],
			["Rickshaw", "transport", 450],
		]);
	});

	it("pays a bill by name and undoes it", async () => {
		const session = await signIn(real.call);
		await push(session.accessToken, [
			{ collection: "finance-settings", id: "settings", data: { id: "settings", setUp: true } },
			{
				collection: "finance-bills",
				id: "b1",
				data: {
					id: "b1",
					name: "Internet",
					provider: "Fibre",
					amount: 3_000,
					dueDay: 5,
					category: "bills",
					paid: [],
				},
			},
		]);
		await push(session.accessToken, [
			{
				collection: "assistant-settings",
				id: "settings",
				data: { id: "settings", approval: "never" },
			},
		]);
		provider([call("c3", "pay_bill", { bill: "internet" })], [say("Paid.")]);
		const got = await events("/assistant/messages", session.accessToken, {
			text: "paid the internet",
			context,
		});
		expect(got.at(-1)).toMatchObject({ type: "done", waiting: false });
		expect(cards(got).some((card) => card.kind === "change" && card.title === "Pay Internet")).toBe(
			true,
		);
		const bill = async () => {
			const [row] = await db
				.select()
				.from(syncRecords)
				.where(
					and(eq(syncRecords.userId, session.user.id), eq(syncRecords.collection, "finance-bills")),
				);
			return parseBill(row?.data);
		};
		expect((await bill())?.paid).toHaveLength(1);
		await real.call("POST", "/assistant/undo", {
			token: session.accessToken,
			body: { callId: "c3" },
		});
		expect((await bill())?.paid).toEqual([]);
	});
});

describe("the person's clock", () => {
	it("counts a Karachi midnight entry in the new month", () => {
		const clock = localClock(new Date("2026-10-31T20:00:00Z"), "Asia/Karachi");
		expect(clock.now.getUTCMonth()).toBe(10);
		expect(clock.shift("2026-10-31T19:30:00Z").slice(0, 10)).toBe("2026-11-01");
	});
});
