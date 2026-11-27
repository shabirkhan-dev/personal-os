/// <reference types="bun" />
import { afterEach, describe, expect, test } from "bun:test";
import * as z from "zod";
import { askJson } from "./ask";
import type { AiConfig } from "./config";
import { AiError } from "./errors";

const config: AiConfig = {
	provider: "openai_compatible",
	apiKey: "sk-test",
	baseUrl: "https://example.test/v1/",
	model: "m",
	headers: { "X-Title": "Personal OS" },
};
const schema = z.object({ total: z.number() });
const realFetch = globalThis.fetch;

function answers(...replies: (string | number)[]) {
	const calls: { url: string; init: RequestInit }[] = [];
	globalThis.fetch = (async (url: string, init: RequestInit) => {
		calls.push({ url, init });
		const reply = replies[Math.min(calls.length - 1, replies.length - 1)];
		if (typeof reply === "number") return new Response("nope", { status: reply });
		return Response.json({ choices: [{ message: { content: reply } }] });
	}) as unknown as typeof fetch;
	return calls;
}

afterEach(() => {
	globalThis.fetch = realFetch;
});

describe("askJson", () => {
	test("sends the key and extra headers to the provider", async () => {
		const calls = answers('{"total": 3}');
		expect(await askJson(config, "Finance", "t", "Add it up", "1+2", schema)).toEqual({ total: 3 });
		expect(calls[0]?.url).toBe("https://example.test/v1/chat/completions");
		const headers = calls[0]?.init.headers as Record<string, string>;
		expect(headers.Authorization).toBe("Bearer sk-test");
		expect(headers["X-Title"]).toBe("Personal OS");
	});

	test("asks once more when the answer doesn't match, with what was wrong", async () => {
		const calls = answers('{"total": "three"}', '```json\n{"total": 3}\n```');
		expect(await askJson(config, "Finance", "t", "Add it up", "1+2", schema)).toEqual({ total: 3 });
		expect(calls).toHaveLength(2);
		const retry = JSON.parse(String(calls[1]?.init.body)) as { messages: { content: string }[] };
		expect(retry.messages.at(-1)?.content).toContain("total");
	});

	test("gives up after the retry", async () => {
		answers("not json at all");
		const failure = askJson(config, "Finance", "t", "Add it up", "1+2", schema);
		await expect(failure).rejects.toBeInstanceOf(AiError);
		await expect(failure).rejects.toMatchObject({ code: "invalid_output" });
	});

	test("names a refused key and an empty quota", async () => {
		answers(401);
		await expect(askJson(config, "F", "t", "i", "c", schema)).rejects.toMatchObject({
			code: "unauthorized",
		});
		answers(429);
		await expect(askJson(config, "F", "t", "i", "c", schema)).rejects.toMatchObject({
			code: "rate_limited",
		});
	});

	test("needs a live provider", async () => {
		await expect(askJson({ provider: "off" }, "F", "t", "i", "c", schema)).rejects.toMatchObject({
			code: "unavailable",
		});
	});
});
