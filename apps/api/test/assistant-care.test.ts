import type { AssistantEvent, Card } from "@personal-os/domain/assistant";
import { parseDay } from "@personal-os/domain/care";
import { and, eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";

import { syncRecords } from "@/db/schema";
import { db, signIn, testApp, testEnv } from "./support";

const env = testEnv({
	AI_PROVIDER: "openai_compatible",
	OPENAI_API_KEY: "sk-test",
	OPENAI_MODEL: "m",
});
const real = testApp(env);
afterEach(() => vi.unstubAllGlobals());

async function events(token: string, text: string): Promise<AssistantEvent[]> {
	const response = await real.app.request(
		"/api/v1/assistant/messages",
		{
			method: "POST",
			headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
			body: JSON.stringify({ text, context: { timeZone: "UTC", module: "skincare" } }),
		},
		env,
	);
	return (await response.text())
		.split("\n")
		.filter((line) => line.startsWith("data:"))
		.map((line) => JSON.parse(line.slice(5)) as AssistantEvent);
}

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
	const spy = vi.fn(
		async () =>
			new Response(
				[
					...(answers[Math.min(spy.mock.calls.length - 1, answers.length - 1)] ?? []).map(
						(chunk) => `data: ${JSON.stringify(chunk)}\n\n`,
					),
					"data: [DONE]\n\n",
				].join(""),
			),
	);
	vi.stubGlobal("fetch", spy);
}

const cards = (got: AssistantEvent[]) =>
	got.flatMap((event) => (event.type === "card" ? [event.card] : [])) as Card[];

/** A two-step morning routine, a habit and a cleanser opened 25 of its 30 days ago. */
async function seed(token: string) {
	const opened = new Date(Date.now() - 25 * 86_400_000).toISOString().slice(0, 10);
	const step = (id: string, name: string, order: number) => ({
		id,
		routine: "morning",
		area: "face",
		name,
		detail: "",
		productId: null,
		minutes: 1,
		days: [],
		short: name,
		order,
	});
	const changes = [
		{
			collection: "assistant-settings",
			id: "settings",
			data: { id: "settings", approval: "never" },
		},
		{ collection: "care-steps", id: "wash", data: step("wash", "Face wash", 1) },
		{ collection: "care-steps", id: "spf", data: step("spf", "Sunscreen", 2) },
		{
			collection: "care-habits",
			id: "floss",
			data: { id: "floss", name: "Floss", detail: "", link: null, order: 1 },
		},
		{
			collection: "care-products",
			id: "cleanser",
			data: {
				id: "cleanser",
				name: "Cleanser",
				area: "face",
				photo: null,
				openedOn: opened,
				lastsDays: 30,
				price: 1800,
			},
		},
	];
	await real.call("POST", "/sync", {
		token,
		body: {
			cursor: null,
			changes: changes.map((change) => ({
				...change,
				updatedAt: Date.now() - 1000,
				deletedAt: null,
			})),
		},
	});
}

describe("assistant care tools", () => {
	it("finishes a routine in one go and keeps it on today's record", async () => {
		const session = await signIn(real.call);
		await seed(session.accessToken);
		provider([call("c1", "tick_care", { routine: "morning", habits: ["floss"] })], [say("Done.")]);
		await events(session.accessToken, "did my morning routine and flossed");
		const [row] = await db
			.select()
			.from(syncRecords)
			.where(and(eq(syncRecords.userId, session.user.id), eq(syncRecords.collection, "care-days")));
		const day = parseDay(row?.data);
		expect(day?.finished).toEqual(["morning"]);
		expect(Object.keys(day?.steps ?? {}).toSorted()).toEqual(["spf", "wash"]);
		expect(day?.habits).toEqual(["floss"]);
	});

	it("shows today's routines and what to reorder", async () => {
		const session = await signIn(real.call);
		await seed(session.accessToken);
		provider(
			[call("c2", "tick_care", { steps: ["sunscreen"] })],
			[call("c3", "care_today", {})],
			[say("One left.")],
		);
		const got = await events(session.accessToken, "put on sunscreen, what's left?");
		const progress = cards(got).find((card) => card.kind === "progress");
		expect(
			progress?.kind === "progress" &&
				progress.items.find((item) => item.label === "Morning")?.text,
		).toBe("1 of 2");
		const lists = cards(got).filter((card) => card.kind === "list");
		expect(lists.map((card) => card.kind === "list" && card.title)).toEqual(
			expect.arrayContaining([expect.stringContaining("Reorder soon")]),
		);
	});

	it("refuses an unknown step and lists the real ones", async () => {
		const session = await signIn(real.call);
		await seed(session.accessToken);
		provider([call("c4", "tick_care", { steps: ["retinol"] })], [say("Which one?")]);
		const got = await events(session.accessToken, "did retinol");
		expect(got.some((event) => event.type === "step" && event.status === "failed")).toBe(true);
	});
});
