/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { type SearchEntry, searchEntries } from "./search-index";

const entry = (title: string, subtitle = "", module = "Food"): SearchEntry => ({
	id: title,
	module,
	title,
	subtitle,
	href: "/",
});

const all = [
	entry("Chicken karahi", "45 min · 4 servings"),
	entry("Karachi trip", "Rs 12,000", "Money"),
	entry("Vitamin D", "energy", "Health"),
	entry("Café latte", "coffee"),
];

describe("search", () => {
	test("an empty query finds nothing", () => {
		expect(searchEntries(all, "   ")).toEqual([]);
	});

	test("a title that starts with the word comes first", () => {
		expect(searchEntries(all, "kara").map((item) => item.title)).toEqual([
			"Karachi trip",
			"Chicken karahi",
		]);
	});

	test("every word must match somewhere", () => {
		expect(searchEntries(all, "chicken min").map((item) => item.title)).toEqual(["Chicken karahi"]);
		expect(searchEntries(all, "chicken money")).toEqual([]);
	});

	test("matches the module name and ignores accents", () => {
		expect(searchEntries(all, "health")[0]?.title).toBe("Vitamin D");
		expect(searchEntries(all, "cafe")[0]?.title).toBe("Café latte");
	});
});
