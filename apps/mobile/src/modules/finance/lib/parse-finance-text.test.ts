/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { parseFinanceText } from "./parse-finance-text";

describe("parseFinanceText", () => {
	test("amount and category", () => {
		expect(parseFinanceText("500 food")).toEqual({
			kind: "expense",
			amount: 500,
			category: "food",
			note: "",
		});
	});

	test("a sentence with filler words", () => {
		expect(parseFinanceText("spent 1200 on transport")).toEqual({
			kind: "expense",
			amount: 1200,
			category: "transport",
			note: "",
		});
	});

	test("currency prefix and a note that implies the category", () => {
		expect(parseFinanceText("rs 300 lunch")).toEqual({
			kind: "expense",
			amount: 300,
			category: "food",
			note: "Lunch",
		});
		expect(parseFinanceText("Rs.1,250.50 uber to office")).toEqual({
			kind: "expense",
			amount: 1250.5,
			category: "transport",
			note: "Uber office",
		});
	});

	test("unknown words default to other", () => {
		expect(parseFinanceText("800 haircut")).toEqual({
			kind: "expense",
			amount: 800,
			category: "other",
			note: "Haircut",
		});
	});

	test("budget and savings", () => {
		expect(parseFinanceText("budget 60,000")).toEqual({ kind: "budget", amount: 60000 });
		expect(parseFinanceText("saved 2k")).toEqual({ kind: "saving", amount: 2000 });
	});

	test("no amount or two amounts is unclear", () => {
		expect(parseFinanceText("coffee with Sara")).toEqual({
			kind: "unclear",
			amount: null,
			category: "food",
			note: "Coffee with Sara",
		});
		expect(parseFinanceText("200 and 300 food").kind).toBe("unclear");
		expect(parseFinanceText("0 food").kind).toBe("unclear");
	});
});
