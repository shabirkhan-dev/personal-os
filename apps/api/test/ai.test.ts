import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { signIn, testApp, testEnv } from "./support";

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
