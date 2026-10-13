/// <reference types="bun" />
import { describe, expect, mock, test } from "bun:test";

mock.module("expo-secure-store", () => ({
	getItemAsync: async () => null,
	setItemAsync: async () => undefined,
	deleteItemAsync: async () => undefined,
}));

const { mergeStoredAnswers } = await import("./answers-storage");
const { initialAnswers } = await import("./onboarding-store");

describe("mergeStoredAnswers", () => {
	test("returns the defaults for anything that is not an object", () => {
		expect(mergeStoredAnswers(null)).toEqual(initialAnswers);
		expect(mergeStoredAnswers("oops")).toEqual(initialAnswers);
	});

	test("keeps stored values that match the expected shape", () => {
		const merged = mergeStoredAnswers({
			name: "Shabir Khan",
			gender: "male",
			modules: ["daily-life", "finance"],
			wakeMinutes: 420,
			completed: true,
		});
		expect(merged.name).toBe("Shabir Khan");
		expect(merged.gender).toBe("male");
		expect(merged.modules).toEqual(["daily-life", "finance"]);
		expect(merged.wakeMinutes).toBe(420);
		expect(merged.completed).toBe(true);
	});

	test("drops unknown keys and values of the wrong type", () => {
		const merged = mergeStoredAnswers({ name: 42, modules: "finance", extra: true });
		expect(merged.name).toBe(initialAnswers.name);
		expect(merged.modules).toEqual(initialAnswers.modules);
		expect("extra" in merged).toBe(false);
	});
});
