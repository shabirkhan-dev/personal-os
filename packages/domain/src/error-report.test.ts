import { describe, expect, test } from "bun:test";
import { buildEnvelope, parseDsn, sendErrorReport, stackFrames } from "./error-report";

const DSN = "https://abc123@o42.ingest.sentry.io/4507";

describe("error reports", () => {
	test("reads a DSN and stays off without one", () => {
		expect(parseDsn(DSN)).toEqual({
			endpoint: "https://o42.ingest.sentry.io/api/4507/envelope/",
			publicKey: "abc123",
			raw: DSN,
		});
		expect(parseDsn(undefined)).toBeNull();
		expect(parseDsn("http://abc@host/1")).toBeNull();
		expect(parseDsn("not a url")).toBeNull();
	});

	test("turns V8 and Hermes stacks into frames, oldest first", () => {
		const v8 = "Error: boom\n    at load (src/app.ts:10:5)\n    at main (src/index.ts:3:1)";
		expect(stackFrames(v8).map((frame) => frame.function)).toEqual(["main", "load"]);
		const hermes = "save@index.bundle:120:14\nonPress@index.bundle:80:2";
		expect(stackFrames(hermes)[0]).toEqual({
			function: "onPress",
			filename: "index.bundle",
			lineno: 80,
			colno: 2,
		});
	});

	test("builds one event with the error and its context", () => {
		const dsn = parseDsn(DSN);
		if (!dsn) throw new Error("expected a DSN");
		const [header, item, body] = buildEnvelope(dsn, new TypeError("bad input"), {
			environment: "production",
			release: "api@1",
			tags: { route: "/sync" },
		}).split("\n");
		expect(JSON.parse(header ?? "{}").dsn).toBe(DSN);
		expect(JSON.parse(item ?? "{}")).toEqual({ type: "event" });
		const event = JSON.parse(body ?? "{}");
		expect(event.exception.values[0]).toMatchObject({ type: "TypeError", value: "bad input" });
		expect(event.tags).toEqual({ route: "/sync" });
		expect(event.release).toBe("api@1");
	});

	test("never throws, even when sending fails", async () => {
		const failing = (() => Promise.reject(new Error("offline"))) as unknown as typeof fetch;
		expect(
			await sendErrorReport(parseDsn(DSN), new Error("x"), { environment: "test" }, failing),
		).toBe(false);
		expect(await sendErrorReport(null, new Error("x"), { environment: "test" })).toBe(false);
	});
});
