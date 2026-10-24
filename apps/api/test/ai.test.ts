import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { aiUsage } from "@/db/schema";
import { db, signIn, testApp, testEnv } from "./support";

const mockApp = testApp();
const realApp = testApp(
	testEnv({
		AI_PROVIDER: "openai_compatible",
		OPENAI_API_KEY: "sk-test",
		OPENAI_MODEL: "gpt-test",
	}),
);

let token = "";
beforeAll(async () => {
	token = (await signIn(mockApp.call)).accessToken;
});
afterEach(() => vi.unstubAllGlobals());

/** Stubs the provider call (the app's own requests go through `app.request`, not fetch). */
function provider(content: string, status = 200) {
	const spy = vi.fn(
		async () => new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status }),
	);
	vi.stubGlobal("fetch", spy);
	return spy;
}

describe("Career AI with the mock provider", () => {
	it("parses a logged line", async () => {
		const response = await mockApp.call("POST", "/ai/career/parse-line", {
			token,
			body: { text: "applied to tessera, senior typescript, 500k, remote", today: "2026-10-15" },
		});
		expect(response.json).toMatchObject({
			data: {
				application: {
					company: "Tessera",
					role: "Senior Typescript",
					pay: "500k",
					where: "Remote",
					stage: "applied",
				},
				followUpInDays: 7,
				interviewAt: null,
			},
		});
	});

	it("drafts a nudge, builds prep and a skill path in camelCase", async () => {
		const nudge = await mockApp.call("POST", "/ai/career/nudge", {
			token,
			body: {
				senderName: "Shabir Khan",
				company: "Tessera",
				role: "Frontend",
				contactName: "Sara Ali",
				daysSinceApplied: 8,
				stories: [{ title: "Auspira", summary: "Contract platform frontend" }],
				tone: "warmer",
			},
		});
		expect(nudge.json).toMatchObject({ data: { subject: "Following up: Frontend" } });
		expect((nudge.json?.data as { body: string } | undefined)?.body).toContain("Hi Sara,");

		const prep = await mockApp.call("POST", "/ai/career/interview-prep", {
			token,
			body: { company: "Tessera", role: "Frontend" },
		});
		expect((prep.json?.data as { flashcards: unknown[] } | undefined)?.flashcards).toHaveLength(4);

		const path = await mockApp.call("POST", "/ai/career/skill-path", {
			token,
			body: { focus: "System design" },
		});
		expect((path.json?.data as { weeks: unknown[] } | undefined)?.weeks).toHaveLength(6);
	});

	it("reads pasted job text and refuses private links", async () => {
		const pasted = await mockApp.call("POST", "/ai/career/read-job", {
			token,
			body: { text: "Senior Engineer\nBuild the app. Rs 450k–550k, remote" },
		});
		expect(pasted.json).toMatchObject({ data: { role: "Senior Engineer", where: "Remote" } });
		const local = await mockApp.call("POST", "/ai/career/read-job", {
			token,
			body: { url: "http://192.168.0.10/job" },
		});
		expect(local.status).toBe(422);
		expect(local.json).toMatchObject({ code: "JOB_LINK_UNREADABLE" });
	});

	it("needs a session and a valid body", async () => {
		expect((await mockApp.call("POST", "/ai/career/nudge", { body: {} })).status).toBe(401);
		const bad = await mockApp.call("POST", "/ai/career/read-job", {
			token,
			body: { url: "https://a.example.com", text: "both" },
		});
		expect(bad.json).toMatchObject({ code: "VALIDATION_FAILED" });
	});
});

describe("Career AI with a real provider", () => {
	it("sends the schema, accepts fenced JSON and trims long text", async () => {
		const spy = provider(
			'```json\n{"subject":"' + "S".repeat(300) + '","body":"Hello","extra":true}\n```',
		);
		const response = await realApp.call("POST", "/ai/career/nudge", {
			token,
			body: { senderName: "Shabir", company: "Tessera", daysSinceApplied: 3 },
		});
		expect(response.status).toBe(200);
		expect(response.json?.data).toEqual({ subject: "S".repeat(120), body: "Hello" });

		const [url, init] = spy.mock.calls[0] as unknown as [string, RequestInit];
		expect(url).toBe("https://api.openai.com/v1/chat/completions");
		const sent = JSON.parse(String(init.body)) as {
			model: string;
			messages: { content: string }[];
		};
		expect(sent.model).toBe("gpt-test");
		expect(sent.messages[0]?.content).toContain('"subject"');
		expect(new Headers(init.headers).get("authorization")).toBe("Bearer sk-test");
	});

	it("answers 502 for an unusable answer and 503 when the provider fails", async () => {
		provider('{"topics": []}');
		const bad = await realApp.call("POST", "/ai/career/interview-prep", {
			token,
			body: { company: "Tessera" },
		});
		expect(bad.status).toBe(502);
		expect(bad.json).toMatchObject({ code: "AI_INVALID_OUTPUT" });

		provider("", 500);
		const down = await realApp.call("POST", "/ai/career/skill-path", {
			token,
			body: { focus: "Go" },
		});
		expect(down.status).toBe(503);
		expect(down.json).toMatchObject({ code: "AI_UNAVAILABLE" });
	});

	it("falls back to unsure when the halal status is unknown", async () => {
		provider(
			JSON.stringify({
				application: { company: "Bank", stage: "applied", halal: { status: "maybe", note: "" } },
				followUpInDays: 7,
			}),
		);
		const response = await realApp.call("POST", "/ai/career/parse-line", {
			token,
			body: { text: "applied to bank", today: "2026-10-15" },
		});
		expect(response.json).toMatchObject({
			data: {
				application: { company: "Bank", role: "", halal: { status: "unsure" } },
				interviewAt: null,
			},
		});
	});
});

describe("Faith AI", () => {
	it("answers with the mock provider and validates the question", async () => {
		const response = await mockApp.call("POST", "/ai/faith/ask", {
			token,
			body: { question: "What does sabr mean?", tradition: "Shia Ismaili", today: "2026-10-15" },
		});
		expect(response.status).toBe(200);
		expect((response.json?.data as { answer: string } | undefined)?.answer).toContain(
			"Shia Ismaili",
		);
		const empty = await mockApp.call("POST", "/ai/faith/ask", {
			token,
			body: { question: " ", today: "2026-10-15" },
		});
		expect(empty.json).toMatchObject({ code: "VALIDATION_FAILED" });
	});

	it("speaks as the Faith assistant and keeps three follow-ups", async () => {
		const spy = provider(
			JSON.stringify({ answer: "  Patience.  ", followUps: ["a", "b", "c", "d", ""] }),
		);
		const response = await realApp.call("POST", "/ai/faith/ask", {
			token,
			body: { question: "Sabr?", today: "2026-10-15", prayers: ["fajr", "maghrib", "isha"] },
		});
		expect(response.json?.data).toEqual({ answer: "Patience.", followUps: ["a", "b", "c"] });
		const [, init] = spy.mock.calls[0] as unknown as [string, RequestInit];
		const sent = JSON.parse(String(init.body)) as { messages: { content: string }[] };
		expect(sent.messages[0]?.content).toContain("Faith assistant");
	});
});

describe("Fashion AI", () => {
	it("reads a typed piece with the mock provider", async () => {
		const response = await mockApp.call("POST", "/ai/fashion/read-piece", {
			token,
			body: { text: "olive overshirt, cotton twill, size M, 6500" },
		});
		expect(response.json?.data).toEqual({
			name: "Olive overshirt",
			category: "layer",
			colour: "olive",
			size: "M",
			fit: "",
			fabric: "cotton twill",
			price: 6500,
			care: "",
			imageUrl: null,
		});
	});

	it("asks the model as the Fashion assistant and trims the outfit", async () => {
		const spy = provider(
			JSON.stringify({ answer: " Olive layers. ", outfit: ["A", "B", "C", "D", "E", "F", "G"] }),
		);
		const response = await realApp.call("POST", "/ai/fashion/ask", {
			token,
			body: {
				question: "What should I wear?",
				today: "2026-10-16",
				wardrobe: [{ name: "Olive overshirt", category: "layer", colour: "olive" }],
				weather: { now: 18, high: 19, low: 10, summary: "clear" },
			},
		});
		expect(response.json?.data).toEqual({
			answer: "Olive layers.",
			outfit: ["A", "B", "C", "D", "E", "F"],
			followUps: [],
		});
		const [, init] = spy.mock.calls[0] as unknown as [string, RequestInit];
		expect(JSON.parse(String(init.body)).messages[0].content).toContain("Fashion assistant");
	});
});

describe("Food AI", () => {
	it("reads a meal line with the mock provider", async () => {
		const response = await mockApp.call("POST", "/ai/food/read-meal", {
			token,
			body: { text: "lunch 2 quinoa bowls and hummus" },
		});
		expect(response.json?.data).toEqual({
			items: [
				{ name: "Quinoa bowls", quantity: 2, unit: "", kcal: 0, protein: 0, carbs: 0, fat: 0 },
				{ name: "Hummus", quantity: 1, unit: "", kcal: 0, protein: 0, carbs: 0, fat: 0 },
			],
			slot: "lunch",
		});
	});

	it("rejects an empty meal line", async () => {
		const response = await mockApp.call("POST", "/ai/food/read-meal", {
			token,
			body: { text: "  " },
		});
		expect(response.status).toBe(400);
	});

	it("asks the model as the Food assistant and trims the answer", async () => {
		const spy = provider(
			JSON.stringify({
				answer: " Karahi with raita. ",
				recipeId: "chicken-karahi",
				followUps: ["a", "b", "c", "d"],
			}),
		);
		const response = await realApp.call("POST", "/ai/food/ask", {
			token,
			body: {
				question: "What should I eat for dinner?",
				today: "2026-10-16",
				goal: "lean bulk",
				targets: { kcal: 2900, protein: 140, carbs: 380, fat: 85 },
				eaten: { kcal: 1620, protein: 96, carbs: 230, fat: 52 },
				meals: [{ slot: "breakfast", names: "Fried eggs, paratha, chai" }],
				recipes: [{ id: "chicken-karahi", name: "Chicken karahi" }],
			},
		});
		expect(response.json?.data).toEqual({
			answer: "Karahi with raita.",
			recipeId: "chicken-karahi",
			followUps: ["a", "b", "c"],
		});
		const [, init] = spy.mock.calls[0] as unknown as [string, RequestInit];
		expect(JSON.parse(String(init.body)).messages[0].content).toContain("Food assistant");
	});
});

describe("Care AI", () => {
	const body = {
		question: "Is my dandruff getting better?",
		today: "2026-10-16",
		concerns: ["dandruff", "dark-spots"],
		skin: ["sensitive"],
		routine: [{ routine: "morning", name: "Sunscreen SPF 50" }],
		ratings: { dandruff: 2 },
		uv: 8,
	};

	it("answers with the mock provider", async () => {
		const response = await mockApp.call("POST", "/ai/care/ask", { token, body });
		expect(response.json?.data).toEqual({
			answer:
				"You asked “Is my dandruff getting better?”. With a provider key set, the answer appears here.",
			followUps: ["What should I change first?"],
		});
	});

	it("rejects a rating outside 1 to 5", async () => {
		const response = await mockApp.call("POST", "/ai/care/ask", {
			token,
			body: { ...body, ratings: { dandruff: 9 } },
		});
		expect(response.status).toBe(400);
	});

	it("speaks as the Care assistant and keeps three follow-ups", async () => {
		const spy = provider(
			JSON.stringify({ answer: " Keep washing twice a week. ", followUps: ["a", "b", "c", "d"] }),
		);
		const response = await realApp.call("POST", "/ai/care/ask", { token, body });
		expect(response.json?.data).toEqual({
			answer: "Keep washing twice a week.",
			followUps: ["a", "b", "c"],
		});
		const [, init] = spy.mock.calls[0] as unknown as [string, RequestInit];
		expect(JSON.parse(String(init.body)).messages[0].content).toContain("Care assistant");
	});
});

describe("Training AI", () => {
	const body = {
		question: "What should I train tomorrow?",
		today: "2026-10-16",
		sports: ["calisthenics", "running"],
		phase: 1,
		week: [{ day: "2026-10-16", title: "Push + handstand", status: "today" }],
		recent: [{ day: "2026-10-15", title: "Easy run", line: "5.0 km · 27:40" }],
	};

	it("answers with the mock provider", async () => {
		const response = await mockApp.call("POST", "/ai/training/ask", { token, body });
		expect(response.json?.data).toMatchObject({
			followUps: ["What should I do tomorrow?"],
		});
	});

	it("speaks as the Training assistant and keeps three follow-ups", async () => {
		const spy = provider(
			JSON.stringify({ answer: " Long run. ", followUps: ["a", "b", "c", "d"] }),
		);
		const response = await realApp.call("POST", "/ai/training/ask", { token, body });
		expect(response.json?.data).toEqual({ answer: "Long run.", followUps: ["a", "b", "c"] });
		const [, init] = spy.mock.calls[0] as unknown as [string, RequestInit];
		expect(JSON.parse(String(init.body)).messages[0].content).toContain("Training assistant");
	});

	it("builds a skill ladder and caps it at eight steps", async () => {
		provider(JSON.stringify({ steps: ["1", "2", "3", "4", "5", "6", "7", "8", "9"] }));
		const response = await realApp.call("POST", "/ai/training/skill", {
			token,
			body: { name: "Planche", sport: "calisthenics" },
		});
		expect(response.json?.data).toMatchObject({ steps: ["1", "2", "3", "4", "5", "6", "7", "8"] });
	});

	it("rejects an extra field", async () => {
		const response = await mockApp.call("POST", "/ai/training/skill", {
			token,
			body: { name: "Planche", extra: 1 },
		});
		expect(response.status).toBe(400);
	});

	const catalog = [
		{
			id: "shoulder-warm-up",
			name: "Wrist and shoulder warm-up",
			pattern: "mobility",
			level: 1,
			unit: "min",
		},
		{ id: "push-up", name: "Push-ups", pattern: "push", level: 2, unit: "reps" },
		{ id: "pull-up", name: "Pull-ups", pattern: "pull", level: 4, unit: "reps" },
		{ id: "plank", name: "Plank", pattern: "core", level: 1, unit: "s" },
		{ id: "bodyweight-squat", name: "Bodyweight squats", pattern: "squat", level: 1, unit: "reps" },
	];
	const programBody = {
		goal: "First muscle-up and a 5 km run",
		level: "intermediate",
		weeks: 8,
		daysPerWeek: 3,
		minutes: 45,
		sports: ["calisthenics", "running"],
		equipment: ["pull-up-bar"],
		exercises: catalog,
	};

	it("drafts a program with the mock provider from the given exercises", async () => {
		const response = await mockApp.call("POST", "/ai/training/program", {
			token,
			body: programBody,
		});
		expect(response.status).toBe(200);
		expect(response.json?.data).toMatchObject({
			title: "Mock program",
			weeks: 8,
			sessions: [{ items: [{ exercise: "shoulder-warm-up" }, { exercise: "push-up" }, {}] }],
		});
	});

	it("drops unknown exercises and clamps the numbers in a model's draft", async () => {
		provider(
			JSON.stringify({
				title: "Pull + run",
				summary: "Pull strength and running.",
				weeks: 40,
				sessions: [
					{
						title: "Pull day",
						sport: "calisthenics",
						focus: "upper",
						minutes: 45,
						items: [
							{ exercise: "pull-up", sets: 30, low: 12, high: 5, restS: 2000 },
							{ exercise: "flying-kick", sets: 3, low: 8, high: 12, restS: 60 },
						],
					},
					{ title: "Empty", sport: "darts", focus: "fun", minutes: 20, items: [] },
				],
				order: [0, 5, 0],
			}),
		);
		const response = await realApp.call("POST", "/ai/training/program", {
			token,
			body: programBody,
		});
		expect(response.json?.data).toEqual({
			title: "Pull + run",
			summary: "Pull strength and running.",
			weeks: 16,
			sessions: [
				{
					title: "Pull day",
					sport: "calisthenics",
					focus: "upper",
					minutes: 45,
					items: [{ exercise: "pull-up", sets: 10, range: [12, 12], restS: 600 }],
				},
			],
			order: [0, 0],
		});
	});

	it("fails when the draft has no usable session", async () => {
		provider(
			JSON.stringify({ title: "x", sessions: [{ title: "a", items: [{ exercise: "nope" }] }] }),
		);
		const response = await realApp.call("POST", "/ai/training/program", {
			token,
			body: programBody,
		});
		expect(response.status).toBe(502);
	});

	it("needs a list of exercises to choose from", async () => {
		const response = await mockApp.call("POST", "/ai/training/program", {
			token,
			body: { ...programBody, exercises: catalog.slice(0, 2) },
		});
		expect(response.status).toBe(400);
	});
});

describe("Finance AI", () => {
	const body = {
		question: "Can I afford a bike service this month?",
		today: "2026-10-16",
		balance: 148_500,
		runwayDays: 81,
		monthlyCost: 55_000,
		monthlyIncome: 0,
		spent: 31_200,
		budget: 55_000,
		lines: [{ name: "Food", spent: 16_860, limit: 24_000 }],
		bills: [{ name: "Electricity", amount: 2400, due: "Sat 18 Oct" }],
		recent: [{ day: "2026-10-16", title: "Bike fuel", amount: 1500, kind: "spend" }],
	};

	it("answers with the mock provider and the runway", async () => {
		const response = await mockApp.call("POST", "/ai/finance/ask", { token, body });
		expect(response.json?.data).toMatchObject({ followUps: ["Where can I cut this month?"] });
		expect(JSON.stringify(response.json?.data)).toContain("81 days of runway");
	});

	it("speaks as the Finance assistant and keeps three follow-ups", async () => {
		const spy = provider(
			JSON.stringify({ answer: " Wait a week. ", followUps: ["a", "b", "c", "d"] }),
		);
		const response = await realApp.call("POST", "/ai/finance/ask", { token, body });
		expect(response.json?.data).toEqual({ answer: "Wait a week.", followUps: ["a", "b", "c"] });
		const [, init] = spy.mock.calls[0] as unknown as [string, RequestInit];
		expect(JSON.parse(String(init.body)).messages[0].content).toContain("Finance assistant");
	});

	it("splits spending and drops items without an amount", async () => {
		provider(
			JSON.stringify({
				items: [
					{ name: "Chicken · 1 kg", amount: 800, category: "food" },
					{ name: "Milk", amount: 0, category: "food" },
					{ name: "Fuel", amount: 1500, category: "rocket" },
				],
				method: "cash",
			}),
		);
		const response = await realApp.call("POST", "/ai/finance/read", {
			token,
			body: { text: "chicken 1 kg 800, milk, fuel 1500 cash" },
		});
		expect(response.json?.data).toEqual({
			items: [
				{ name: "Chicken · 1 kg", amount: 800, category: "food" },
				{ name: "Fuel", amount: 1500, category: "other" },
			],
			method: "cash",
		});
	});

	it("reads with the mock provider", async () => {
		const response = await mockApp.call("POST", "/ai/finance/read", {
			token,
			body: { text: "groceries 1680 and fuel 1500, cash" },
		});
		expect(response.json?.data).toMatchObject({ method: "cash" });
	});

	it("rejects an extra field", async () => {
		const response = await mockApp.call("POST", "/ai/finance/ask", {
			token,
			body: { ...body, extra: 1 },
		});
		expect(response.status).toBe(400);
	});
});

describe("Wishlist AI", () => {
	it("reads a typed dream with the mock provider", async () => {
		const response = await mockApp.call("POST", "/ai/wishlist/find", {
			token,
			body: { text: "a GPS sports watch for running and boxing", today: "2026-10-17" },
		});
		expect(response.status).toBe(200);
		expect(response.json).toMatchObject({
			data: { name: "GPS sports watch", category: "other", options: [] },
		});
	});

	it("clamps what the model returns", async () => {
		provider(
			JSON.stringify({
				name: "GPS sports watch",
				category: "watches",
				options: [
					{ label: "Sport", price: 120000.4 },
					{ label: "Lite", price: 65000 },
					{ label: "Pro", price: 210000 },
					{ label: "Ultra", price: 400000 },
					{ label: "", price: 1 },
				],
				priceLow: 110000,
				priceHigh: -5,
				fits: "Training · running",
			}),
		);
		const response = await realApp.call("POST", "/ai/wishlist/find", {
			token,
			body: { text: "a GPS sports watch", today: "2026-10-17" },
		});
		expect(response.json).toMatchObject({
			data: {
				category: "other",
				options: [
					{ label: "Sport", price: 120000 },
					{ label: "Lite", price: 65000 },
					{ label: "Pro", price: 210000 },
				],
				priceLow: 110000,
				priceHigh: 0,
			},
		});
	});

	it("rejects an empty line and a signed-out caller", async () => {
		const bad = await mockApp.call("POST", "/ai/wishlist/find", {
			token,
			body: { text: "", today: "2026-10-17" },
		});
		expect(bad.status).toBe(400);
		expect((await mockApp.call("POST", "/ai/wishlist/find", { body: {} })).status).toBe(401);
	});
});

describe("AI allowance", () => {
	it("stops a user at the daily cap, with the cap's own code", async () => {
		const session = await signIn(mockApp.call);
		const day = new Date().toISOString().slice(0, 10);
		await db.insert(aiUsage).values({ userId: session.user.id, day, calls: 150 });
		const response = await mockApp.call("POST", "/ai/career/parse-line", {
			token: session.accessToken,
			body: { text: "applied to tessera", today: "2026-10-15" },
		});
		expect(response.status).toBe(429);
		expect(response.json).toMatchObject({ success: false, code: "AI_QUOTA_REACHED" });
	});

	it("asks the provider for a bounded answer", async () => {
		const spy = provider(JSON.stringify({ name: "x" }));
		await realApp.call("POST", "/ai/wishlist/find", {
			token,
			body: { text: "a laptop", today: "2026-10-17" },
		});
		const [, init] = spy.mock.calls[0] as unknown as [string, RequestInit];
		const body = JSON.parse(String(init.body)) as { max_tokens: number };
		expect(body.max_tokens).toBe(4000);
	});
});
