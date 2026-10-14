/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import type { Expense, ExpenseCategory } from "./finance-model";
import {
	categoryTotals,
	dailyBudget,
	dailyRange,
	daysInMonth,
	lastEntryDate,
	leftToSpend,
	moneySplit,
	percentOf,
	rangePosition,
	relativeTime,
	savingsProgress,
	spendTicks,
	spentThisMonth,
	sumAmounts,
} from "./finance-math";

const at = (month: number, day: number, hour = 12, minute = 0) =>
	new Date(2026, month, day, hour, minute);

let seq = 0;
function expense(amount: number, date: Date, category: ExpenseCategory = "other"): Expense {
	seq += 1;
	return { id: String(seq), amount, category, note: "", date: date.toISOString() };
}

const now = at(9, 14, 16, 20);

describe("totals", () => {
	test("sums without float noise", () => {
		expect(sumAmounts([{ amount: 0.1 }, { amount: 0.2 }])).toBe(0.3);
	});

	test("spent this month ignores other months", () => {
		const list = [expense(500, at(9, 1)), expense(700, at(9, 14)), expense(900, at(8, 30))];
		expect(spentThisMonth(list, now)).toBe(1200);
	});

	test("left to spend and daily budget", () => {
		expect(leftToSpend(null, 100)).toBeNull();
		expect(leftToSpend(5000, 6000)).toBe(-1000);
		expect(daysInMonth(now)).toBe(31);
		expect(dailyBudget(31000, now)).toBe(1000);
		expect(dailyBudget(null, now)).toBeNull();
	});

	test("percent is null without a base", () => {
		expect(percentOf(620, 1000)).toBe(62);
		expect(percentOf(620, null)).toBeNull();
		expect(percentOf(620, 0)).toBeNull();
	});

	test("category totals keep the Figma order and skip empty ones", () => {
		const list = [
			expense(180, now, "bills"),
			expense(520, now, "food"),
			expense(240.5, now, "transport"),
		];
		expect(categoryTotals(list)).toEqual([
			{ category: "food", amount: 520 },
			{ category: "transport", amount: 240.5 },
			{ category: "bills", amount: 180 },
		]);
	});
});

describe("spendTicks", () => {
	test("fills a share of the daily budget and leaves the rest grey", () => {
		const ticks = spendTicks(
			[
				{ category: "food", amount: 300 },
				{ category: "shopping", amount: 200 },
			],
			1000,
			10,
		);
		expect(ticks).toEqual([
			"food",
			"food",
			"food",
			"shopping",
			"shopping",
			null,
			null,
			null,
			null,
			null,
		]);
	});

	test("without a budget the whole bar is today's spending", () => {
		const ticks = spendTicks([{ category: "food", amount: 50 }], null, 4);
		expect(ticks).toEqual(["food", "food", "food", "food"]);
	});

	test("over budget fills every tick and keeps small categories visible", () => {
		const ticks = spendTicks(
			[
				{ category: "food", amount: 5000 },
				{ category: "bills", amount: 10 },
			],
			1000,
			8,
		);
		expect(ticks.filter((t) => t === null)).toHaveLength(0);
		expect(ticks).toContain("bills");
	});

	test("nothing spent is all grey", () => {
		expect(spendTicks([], 1000, 3)).toEqual([null, null, null]);
	});
});

describe("dailyRange", () => {
	test("null with no entries this month", () => {
		expect(dailyRange([expense(100, at(8, 2))], now)).toBeNull();
	});

	test("average, low and peak from the first logged day through today", () => {
		const list = [
			expense(300, at(9, 12)),
			expense(900, at(9, 13)),
			expense(200, at(9, 13)),
			expense(400, at(9, 14)),
		];
		expect(dailyRange(list, now)).toEqual({
			average: 600,
			low: 300,
			peak: 1100,
			today: 400,
			days: 3,
		});
	});

	test("a day without spending counts as zero", () => {
		const range = dailyRange([expense(600, at(9, 12))], now);
		expect(range?.low).toBe(0);
		expect(range?.average).toBe(200);
		expect(range?.today).toBe(0);
	});

	test("range position clamps and centres equal bounds", () => {
		expect(rangePosition(5, 0, 10)).toBe(0.5);
		expect(rangePosition(20, 0, 10)).toBe(1);
		expect(rangePosition(3, 3, 3)).toBe(0.5);
	});
});

describe("relativeTime", () => {
	test("reads like the Figma label", () => {
		expect(relativeTime(new Date(now.getTime() - 30_000), now)).toBe("Just now");
		expect(relativeTime(at(9, 14, 16, 18), now)).toBe("2 min ago");
		expect(relativeTime(at(9, 14, 13, 10), now)).toBe("3 h ago");
		expect(relativeTime(at(9, 13, 22), now)).toBe("Yesterday");
		expect(relativeTime(at(9, 10, 22), now)).toBe("4 days ago");
	});

	test("last entry is the newest date", () => {
		const list = [expense(1, at(9, 2)), expense(1, at(9, 9)), expense(1, at(9, 5))];
		expect(lastEntryDate(list)?.getDate()).toBe(9);
		expect(lastEntryDate([])).toBeNull();
	});
});

describe("savingsProgress", () => {
	test("progress and change vs last month", () => {
		const goal = {
			target: 30000,
			contributions: [
				{ id: "a", amount: 10000, date: at(8, 10).toISOString() },
				{ id: "b", amount: 8000, date: at(8, 20).toISOString() },
				{ id: "c", amount: 1200, date: at(9, 3).toISOString() },
			],
		};
		expect(savingsProgress(goal, now)).toEqual({
			saved: 19200,
			target: 30000,
			percent: 64,
			addedThisMonth: 1200,
			changePercent: 6.7,
		});
	});

	test("first month has no change and progress caps at 100", () => {
		const goal = {
			target: 1000,
			contributions: [{ id: "a", amount: 1500, date: at(9, 3).toISOString() }],
		};
		const progress = savingsProgress(goal, now);
		expect(progress.percent).toBe(100);
		expect(progress.changePercent).toBeNull();
	});
});

describe("moneySplit", () => {
	test("splits symbol, number and decimals", () => {
		expect(moneySplit(42300)).toEqual({ symbol: "Rs", number: "42,300", decimal: ".00" });
		expect(moneySplit(1240.5)).toEqual({ symbol: "Rs", number: "1,240", decimal: ".50" });
	});
});
