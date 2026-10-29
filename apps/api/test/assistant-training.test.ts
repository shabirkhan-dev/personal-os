import type { AssistantEvent, Card } from "@personal-os/domain/assistant";
import { parseSession } from "@personal-os/domain/training";
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
const context = { timeZone: "Asia/Karachi", module: "workout" };

async function push(token: string, sessions: unknown[]) {
	await real.call("POST", "/sync", {
		token,
		body: {
			cursor: null,
			changes: sessions.map((data) => ({
				collection: "training-sessions",
				id: (data as { id: string }).id,
				data,
				updatedAt: Date.now() - 1000,
				deletedAt: null,
			})),
		},
	});
}

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

describe("assistant training tools", () => {
	it("sums the week and shows recent sessions", async () => {
		const session = await signIn(real.call);
		await push(session.accessToken, [
			{
				id: "s1",
				sport: "running",
				title: "Easy run",
				startedAt: daysAgo(0),
				durationMin: 30,
				distanceKm: 5,
				kcal: 300,
			},
			{
				id: "s2",
				sport: "calisthenics",
				title: "Pull day",
				startedAt: daysAgo(20),
				durationMin: 45,
				kcal: 250,
			},
		]);
		provider([call("c1", "training_overview", {})], [say("Good week.")]);
		const got = await events("/assistant/messages", session.accessToken, {
			text: "how's my training",
			context,
		});
		expect(cards(got).find((card) => card.kind === "metric")).toMatchObject({
			label: "This week",
			value: "1 session · 30 min",
		});
		expect(cards(got).some((card) => card.kind === "chart")).toBe(true);
	});

	it("logs a run with sets once approved, with calories from their weight", async () => {
		const session = await signIn(real.call);
		provider(
			[
				call("c2", "log_session", {
					sport: "calisthenics",
					title: "Pull day",
					minutes: 40,
					feel: "good",
					sets: [
						{ exercise: "Pull-ups", value: 10 },
						{ exercise: "Pull-ups", value: 8 },
					],
				}),
			],
			[say("Logged.")],
		);
		await events("/assistant/messages", session.accessToken, {
			text: "did pull day, 10 and 8 pull ups",
			context,
		});
		const done = await events("/assistant/approvals", session.accessToken, {
			callId: "c2",
			approve: true,
			timeZone: "Asia/Karachi",
		});
		expect(done.at(-1)).toEqual({ type: "done", changed: ["training-sessions"], waiting: false });
		const [row] = await db
			.select()
			.from(syncRecords)
			.where(
				and(
					eq(syncRecords.userId, session.user.id),
					eq(syncRecords.collection, "training-sessions"),
				),
			);
		const logged = parseSession(row?.data);
		expect(logged).toMatchObject({
			sport: "calisthenics",
			title: "Pull day",
			durationMin: 40,
			feel: "good",
		});
		expect(logged?.sets).toHaveLength(2);
		expect(logged?.kcal).toBeGreaterThan(0);
	});

	it("charts an exercise's best set per session", async () => {
		const session = await signIn(real.call);
		await push(session.accessToken, [
			{
				id: "p1",
				sport: "calisthenics",
				title: "Pull",
				startedAt: daysAgo(14),
				durationMin: 30,
				sets: [{ exercise: "Pull-ups", value: 6 }],
			},
			{
				id: "p2",
				sport: "calisthenics",
				title: "Pull",
				startedAt: daysAgo(7),
				durationMin: 30,
				sets: [
					{ exercise: "Pull-ups", value: 9 },
					{ exercise: "Pull-ups", value: 7 },
				],
			},
		]);
		provider([call("c3", "exercise_progress", { exercise: "pull up" })], [say("Up 3.")]);
		const got = await events("/assistant/messages", session.accessToken, {
			text: "how are my pull ups",
			context,
		});
		expect(cards(got).find((card) => card.kind === "metric")).toMatchObject({ value: "9 reps" });
		const chart = cards(got).find((card) => card.kind === "chart");
		expect(chart?.kind === "chart" && chart.points.map((point) => point.value)).toEqual([6, 9]);
	});
});
