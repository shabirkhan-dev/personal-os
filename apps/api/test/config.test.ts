import { describe, expect, it } from "vitest";

import { parseConfig } from "@/config/env";
import { errors } from "@/config/messages";

describe("config", () => {
	it("requires real secrets and an email key in production", () => {
		expect(() => parseConfig({ ENVIRONMENT: "production" })).toThrow(
			/JWT_SECRET.*AUTH_TOKEN_SECRET.*RESEND_API_KEY/,
		);
		const config = parseConfig({
			ENVIRONMENT: "production",
			JWT_SECRET: "j".repeat(40),
			AUTH_TOKEN_SECRET: "t".repeat(40),
			RESEND_API_KEY: "re_123",
		});
		expect(config.auth.exposeCodes).toBe(false);
		expect(config.r2).toBeUndefined();
	});

	it("needs a key for the real AI provider", () => {
		expect(() =>
			parseConfig({ ENVIRONMENT: "development", AI_PROVIDER: "openai_compatible" }),
		).toThrow(/OPENAI_API_KEY/);
	});

	it("exposes codes only outside production without an email key", () => {
		expect(parseConfig({ ENVIRONMENT: "development" }).auth.exposeCodes).toBe(true);
		expect(
			parseConfig({ ENVIRONMENT: "development", RESEND_API_KEY: "re_1" }).auth.exposeCodes,
		).toBe(false);
	});

	it("has a client message for every error code", () => {
		for (const [code, entry] of Object.entries(errors)) {
			expect(entry.message.length, code).toBeGreaterThan(5);
			expect(entry.status, code).toBeGreaterThanOrEqual(400);
		}
	});
});
