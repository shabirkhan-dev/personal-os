/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { isEmail } from "./email";

describe("isEmail", () => {
	test("accepts ordinary addresses", () => {
		expect(isEmail("you@example.com")).toBe(true);
		expect(isEmail("first.last+tag@mail.example.co.uk")).toBe(true);
	});

	test("rejects malformed addresses", () => {
		for (const value of ["you", "you@", "@example.com", "you@example", "you@example.", "a b@c.d"]) {
			expect(isEmail(value)).toBe(false);
		}
	});

	test("stays fast on adversarial input", () => {
		const started = performance.now();
		expect(isEmail(`a@${".".repeat(50_000)}`)).toBe(false);
		expect(isEmail(`a@${"a.".repeat(100)}`)).toBe(false);
		expect(performance.now() - started).toBeLessThan(50);
	});
});
