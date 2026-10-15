import { describe, expect, it } from "bun:test";
import { afterWakePhrase, heardWakePhrase } from "./wake-phrase";

describe("wake phrase", () => {
	it("accepts the ways recognisers write Hey OS", () => {
		for (const text of [
			"Hey OS",
			"hey o s",
			"hey, OS.",
			"Hey oh es",
			"okay OS",
			"hi OS what's next",
			"hey operating system",
			"hey Personal OS",
		]) {
			expect(heardWakePhrase(text)).toBe(true);
		}
	});

	it("ignores ordinary speech", () => {
		for (const text of [
			"hello there",
			"those shoes",
			"hey Oscar",
			"hey ostrich",
			"they also said",
		]) {
			expect(heardWakePhrase(text)).toBe(false);
		}
	});

	it("keeps the words said right after it", () => {
		expect(afterWakePhrase("Hey OS, prayed fajr")).toBe("prayed fajr");
		expect(afterWakePhrase("hey OS")).toBe("");
	});
});
