import { describe, expect, it, vi } from "vitest";

import { Hono } from "hono";

import { createApp } from "@/app";
import { loadConfig } from "@/config/env";
import type { AppEnv } from "@/core/context";
import { onError } from "@/core/error-handler";
import { testEnv } from "./support";

const app = createApp({ openDatabase: () => ({ db: {} as never, close: async () => undefined }) });

describe("production hardening", () => {
	it("marks API answers as not cacheable and sends the security headers", async () => {
		const response = await app.request("/api/v1/health", {}, testEnv());
		expect(response.status).toBe(200);
		expect(response.headers.get("cache-control")).toBe("no-store");
		expect(response.headers.get("x-content-type-options")).toBe("nosniff");
		expect(response.headers.get("x-request-id")).toMatch(/^req_/);
	});

	it("reports an unexpected failure to the crash reporter only when a DSN is set", async () => {
		const sent: string[] = [];
		const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
			sent.push(String(input));
			return new Response(null, { status: 200 });
		});
		const failing = new Hono<AppEnv>()
			.use(async (c, next) => {
				c.set("config", loadConfig(c.env));
				await next();
			})
			.get("/boom", () => {
				throw new Error("unexpected");
			});
		failing.onError(onError);
		try {
			const quiet = await failing.request("/boom", {}, testEnv());
			expect(quiet.status).toBe(500);
			expect(sent).toEqual([]);

			const loud = await failing.request(
				"/boom",
				{},
				testEnv({ SENTRY_DSN: "https://key@o1.ingest.sentry.io/123" }),
			);
			expect(loud.status).toBe(500);
			await vi.waitFor(() =>
				expect(sent).toEqual(["https://o1.ingest.sentry.io/api/123/envelope/"]),
			);
		} finally {
			fetchSpy.mockRestore();
		}
	});
});
