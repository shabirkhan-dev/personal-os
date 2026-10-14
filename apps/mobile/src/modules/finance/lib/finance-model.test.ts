/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { initialFinance, parseFinanceDoc } from "./finance-model";

describe("parseFinanceDoc", () => {
	test("falls back to empty for missing or damaged data", () => {
		expect(parseFinanceDoc(null)).toEqual(initialFinance);
		expect(parseFinanceDoc("oops")).toEqual(initialFinance);
	});

	test("keeps valid entries and drops broken ones", () => {
		const doc = parseFinanceDoc({
			budget: 50000,
			expenses: [
				{ id: "a", amount: 500, category: "food", note: "", date: "2026-10-14T08:00:00.000Z" },
				{ id: "b", amount: -5, category: "food", note: "", date: "2026-10-14T08:00:00.000Z" },
				{ id: "c", amount: 90, category: "pets", note: "x", date: "2026-10-14T08:00:00.000Z" },
				{ id: "d", amount: 90, category: "food", note: "x", date: "not a date" },
			],
			goal: { target: 30000, contributions: [{ id: "s", amount: 1000, date: "2026-10-01" }, {}] },
		});
		expect(doc.budget).toBe(50000);
		expect(doc.expenses.map((e) => e.id)).toEqual(["a", "c"]);
		expect(doc.expenses[1]?.category).toBe("other");
		expect(doc.goal?.contributions).toHaveLength(1);
	});

	test("a zero budget or target means not set", () => {
		const doc = parseFinanceDoc({ budget: 0, expenses: [], goal: { target: 0 } });
		expect(doc.budget).toBeNull();
		expect(doc.goal).toBeNull();
	});
});
