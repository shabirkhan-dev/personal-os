import type { AssistantEvent, Card } from "@personal-os/domain/assistant";
import { parseMeal, parseWater } from "@personal-os/domain/food";
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

/** One streamed answer per model call; returns the requests the model received. */
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
	return spy;
}

const cards = (got: AssistantEvent[]) =>
	got.flatMap((event) => (event.type === "card" ? [event.card] : [])) as Card[];
const context = { timeZone: "Asia/Karachi", module: "food" };

async function never(token: string) {
	await real.call("POST", "/sync", {
		token,
		body: {
			cursor: null,
			changes: [
				{
					collection: "assistant-settings",
					id: "settings",
					data: { id: "settings", approval: "never" },
					updatedAt: Date.now() - 1000,
					deletedAt: null,
				},
			],
		},
	});
}

const rows = (userId: string, collection: string) =>
	db
		.select()
		.from(syncRecords)
		.where(and(eq(syncRecords.userId, userId), eq(syncRecords.collection, collection)));

describe("assistant food tools", () => {
	it("logs a meal from the person's words with the food list's macros", async () => {
		const session = await signIn(real.call);
		await never(session.accessToken);
		provider(
			[call("c1", "log_meal", { text: "2 fried eggs and a paratha", slot: "breakfast" })],
			[say("Logged.")],
		);
		await events("/assistant/messages", session.accessToken, {
			text: "breakfast was 2 fried eggs and a paratha",
			context,
		});
		const [row] = await rows(session.user.id, "food-meals");
		const meal = parseMeal(row?.data);
		expect(meal?.slot).toBe("breakfast");
		expect(meal?.items.map((item) => item.name)).toContain("Fried egg");
		expect(meal?.items.find((item) => item.name === "Fried egg")?.quantity).toBe(2);
	});

	it("asks the model to estimate foods the list doesn't know", async () => {
		const session = await signIn(real.call);
		await never(session.accessToken);
		const spy = provider(
			[call("c2", "log_meal", { text: "a bowl of quinoa" })],
			[
				call("c3", "log_meal", {
					items: [
						{
							name: "Quinoa",
							quantity: 1,
							unit: "bowl",
							kcal: 220,
							protein: 8,
							carbs: 39,
							fat: 3.5,
						},
					],
				}),
			],
			[say("Logged with my estimate.")],
		);
		await events("/assistant/messages", session.accessToken, { text: "had quinoa", context });
		const second = JSON.parse((spy.mock.calls[1] as unknown as [string, { body: string }])[1].body);
		expect(second.messages.at(-1).content).toContain("quinoa");
		const [row] = await rows(session.user.id, "food-meals");
		expect(parseMeal(row?.data)?.items[0]).toMatchObject({ name: "Quinoa", kcal: 220 });
	});

	it("adds water to today's total and shows today against the targets", async () => {
		const session = await signIn(real.call);
		await never(session.accessToken);
		provider(
			[call("c4", "log_water", { ml: 500 })],
			[call("c5", "log_water", { ml: 250 })],
			[call("c6", "food_today", {})],
			[say("Done.")],
		);
		const got = await events("/assistant/messages", session.accessToken, {
			text: "drank 500 then 250",
			context,
		});
		const [row] = await rows(session.user.id, "food-water");
		expect(parseWater(row?.data)?.ml).toBe(750);
		const progress = cards(got).find((card) => card.kind === "progress");
		expect(
			progress?.kind === "progress" && progress.items.find((item) => item.label === "Water")?.used,
		).toBe(750);
	});
});
