import type { AssistantEvent, Card } from "@personal-os/domain/assistant";
import { parseEvent } from "@personal-os/domain/calendar";
import { parsePrayerLog } from "@personal-os/domain/faith";
import { parseWear } from "@personal-os/domain/fashion";
import { parseDream } from "@personal-os/domain/wishlist";
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
			body: JSON.stringify({ text, context: { timeZone: "UTC" } }),
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

/** A fresh account that lets the assistant change things without asking, plus `records`. */
async function account(records: { collection: string; id: string; data: unknown }[] = []) {
	const session = await signIn(real.call);
	const changes = [
		{
			collection: "assistant-settings",
			id: "settings",
			data: { id: "settings", approval: "never" },
		},
		...records,
	];
	await real.call("POST", "/sync", {
		token: session.accessToken,
		body: {
			cursor: null,
			changes: changes.map((change) =>
				Object.assign({}, change, { updatedAt: Date.now() - 1000, deletedAt: null }),
			),
		},
	});
	return session;
}

const stored = async (userId: string, collection: string) =>
	(
		await db
			.select()
			.from(syncRecords)
			.where(and(eq(syncRecords.userId, userId), eq(syncRecords.collection, collection)))
	).map((row) => row.data);

const today = new Date().toISOString().slice(0, 10);

/** A wardrobe piece as the phone stores it. */
const piece = (id: string, name: string, category: string, colour: string) => ({
	collection: "fashion-pieces",
	id,
	data: { id, name, category, colour, createdAt: new Date().toISOString() },
});

describe("assistant faith, calendar, wishlist and fashion tools", () => {
	it("logs prayers and reads them back with the day", async () => {
		const session = await account([
			{
				collection: "faith-settings",
				id: "settings",
				data: { id: "settings", setUp: true, prayers: ["fajr", "maghrib", "isha"] },
			},
		]);
		provider(
			[call("c1", "log_prayer", { prayers: ["fajr", "isha"] })],
			[call("c2", "faith_today", {})],
			[say("Two of three.")],
		);
		const got = await events(session.accessToken, "prayed fajr and isha");
		const logs = (await stored(session.user.id, "faith-prayer-logs")).map(parsePrayerLog);
		expect(logs.map((log) => log?.id).toSorted()).toEqual([`${today}:fajr`, `${today}:isha`]);
		const list = cards(got).find((card) => card.kind === "list");
		expect(list?.kind === "list" && list.title).toBe("Prayers today · 2 of 3");
	});

	it("adds an event and shows it next to a bill due", async () => {
		const dueDay = Number(today.slice(8, 10));
		const session = await account([
			{
				collection: "finance-bills",
				id: "b1",
				data: {
					id: "b1",
					name: "Internet",
					provider: "",
					amount: 3000,
					dueDay,
					category: "bills",
					paid: [],
				},
			},
		]);
		provider(
			[call("c3", "add_event", { title: "Dinner with family", date: today, start: "20:00" })],
			[call("c4", "calendar_view", {})],
			[say("Added.")],
		);
		const got = await events(session.accessToken, "dinner with family tonight at 8");
		const [event] = (await stored(session.user.id, "calendar-events")).map(parseEvent);
		expect(event).toMatchObject({ title: "Dinner with family", date: today, start: 20 * 60 });
		const list = cards(got).find((card) => card.kind === "list");
		const titles = list?.kind === "list" ? list.items.map((item) => item.title) : [];
		expect(titles).toEqual(expect.arrayContaining(["Dinner with family", "Internet due"]));
	});

	it("adds a dream at the end of the line and shows its progress", async () => {
		const session = await account();
		provider(
			[
				call("c5", "add_dream", {
					name: "Road bike",
					price: 250_000,
					category: "bikes",
					why: "Long Sunday rides",
				}),
			],
			[call("c6", "wishlist_view", {})],
			[say("Added.")],
		);
		const got = await events(session.accessToken, "add a road bike for 250k, for Sunday rides");
		const [dream] = (await stored(session.user.id, "wishlist-dreams")).map(parseDream);
		expect(dream).toMatchObject({ name: "Road bike", price: 250_000, status: "want", priority: 1 });
		expect(cards(got).some((card) => card.kind === "progress")).toBe(true);
	});

	it("logs today's outfit from piece names", async () => {
		const session = await account([
			piece("p1", "Navy oxford", "top", "navy"),
			piece("p2", "Grey chinos", "bottom", "grey"),
		]);
		provider(
			[call("c7", "log_outfit", { pieces: ["navy oxford", "chinos"], look: "Office" })],
			[say("Logged.")],
		);
		await events(session.accessToken, "wore my navy oxford and chinos");
		const [wear] = (await stored(session.user.id, "fashion-wears")).map(parseWear);
		expect(wear).toMatchObject({ id: today, look: "Office", pieceIds: ["p1", "p2"] });
	});
});
