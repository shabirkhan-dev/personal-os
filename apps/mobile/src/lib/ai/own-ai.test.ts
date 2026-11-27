/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { pickFreeModels } from "./free-models";
import { maskKey, ownAiConfig, parseOwnAi } from "./own-ai-config";

describe("own AI key", () => {
	test("reads a complete saved key and refuses anything incomplete", () => {
		const own = {
			provider: "openrouter",
			baseUrl: "https://openrouter.ai/api/v1",
			model: "some/model:free",
			apiKey: " sk-or-123456789 ",
		};
		expect(parseOwnAi(JSON.stringify(own))?.apiKey).toBe("sk-or-123456789");
		expect(parseOwnAi(JSON.stringify({ ...own, apiKey: "" }))).toBeNull();
		expect(parseOwnAi(JSON.stringify({ ...own, baseUrl: "http://plain.example" }))).toBeNull();
		expect(parseOwnAi(JSON.stringify({ ...own, provider: "mystery" }))).toBeNull();
		expect(parseOwnAi("not json")).toBeNull();
		expect(parseOwnAi(null)).toBeNull();
	});

	test("OpenRouter gets the app's name; the key is never shown in full", () => {
		const config = ownAiConfig({
			provider: "openrouter",
			baseUrl: "https://openrouter.ai/api/v1",
			model: "m",
			apiKey: "sk-or-v1-abcdefgh1234",
		});
		expect(config).toMatchObject({ provider: "openai_compatible", model: "m" });
		expect(config.provider === "openai_compatible" && config.headers?.["X-Title"]).toBe(
			"Personal OS",
		);
		expect(maskKey("sk-or-v1-abcdefgh1234")).toBe("sk-or…1234");
	});

	test("picks free text models that answer in JSON, the auto router first", () => {
		const text = { output_modalities: ["text"] };
		const json = ["response_format", "temperature"];
		const free = { prompt: "0", completion: "0" };
		const models = pickFreeModels({
			data: [
				{
					id: "paid/model",
					pricing: { prompt: "0.000001", completion: "0.000002" },
					architecture: text,
					supported_parameters: json,
				},
				{
					id: "a/small:free",
					name: "Small (free)",
					context_length: 8000,
					pricing: free,
					architecture: text,
					supported_parameters: json,
				},
				{
					id: "b/big:free",
					name: "Big (free)",
					context_length: 128000,
					pricing: free,
					architecture: text,
					supported_parameters: json,
				},
				{
					id: "c/music",
					name: "Music",
					context_length: 999999,
					pricing: free,
					architecture: { output_modalities: ["text", "audio"] },
					supported_parameters: json,
				},
				{
					id: "d/no-json:free",
					context_length: 500000,
					pricing: free,
					architecture: text,
					supported_parameters: ["temperature"],
				},
				{
					id: "openrouter/free",
					context_length: 200000,
					pricing: free,
					architecture: text,
					supported_parameters: json,
				},
			],
		});
		expect(models.map((model) => model.id)).toEqual([
			"openrouter/free",
			"b/big:free",
			"a/small:free",
		]);
		expect(models[0]?.name).toBe("Any free model (auto)");
		expect(models[1]?.name).toBe("Big");
		expect(pickFreeModels(null)).toEqual([]);
	});
});
