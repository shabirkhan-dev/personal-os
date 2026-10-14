/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { formatMoney, moneyParts, parseAmount } from "./money";

describe("money", () => {
	test("splits amounts like the Figma hero", () => {
		expect(moneyParts(18500)).toEqual({ whole: "Rs 18,500", decimal: ".00" });
		expect(moneyParts(1240.5)).toEqual({ whole: "Rs 1,240", decimal: ".50" });
		expect(formatMoney(240.5)).toBe("Rs 240.50");
		expect(formatMoney(300)).toBe("Rs 300");
	});

	test("reads typed amounts", () => {
		expect(parseAmount("1,240")).toBe(1240);
		expect(parseAmount("Rs 300.5")).toBe(300.5);
		expect(parseAmount("abc")).toBeNull();
		expect(parseAmount("0")).toBeNull();
	});
});
