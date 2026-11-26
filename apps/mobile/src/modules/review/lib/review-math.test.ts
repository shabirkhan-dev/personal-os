/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { buildReview, lastSevenDays, type ReviewInput } from "./review-math";

const now = new Date(2026, 10, 26, 18, 0);
const days = lastSevenDays(now);

const empty: ReviewInput = {
	days,
	prayers: [],
	sessions: [],
	spending: [],
	monthBudget: 0,
	meals: [],
	water: [],
	waterGoalMl: 0,
	sleep: [],
	care: [],
	hasCare: false,
	minimum: [],
};

describe("weekly review", () => {
	test("the week is the seven days ending today", () => {
		expect(days).toHaveLength(7);
		expect(days[0]).toBe("2026-11-20");
		expect(days[6]).toBe("2026-11-26");
	});

	test("an empty week shows nothing and suggests nothing", () => {
		expect(buildReview(empty)).toEqual({ lines: [], suggestions: [] });
	});

	test("counts prayers inside the week only", () => {
		const review = buildReview({
			...empty,
			prayers: [
				{ day: "2026-11-25", status: "prayed" },
				{ day: "2026-11-25", status: "late" },
				{ day: "2026-11-24", status: "missed" },
				{ day: "2026-11-10", status: "prayed" },
			],
		});
		const line = review.lines.find((item) => item.key === "prayers");
		expect(line?.value).toBe("2 of 35");
		expect(line?.detail).toBe("1 on time, 1 late, 1 missed");
	});

	test("money compares with a week's share of the budget", () => {
		const review = buildReview({
			...empty,
			monthBudget: 30_000,
			spending: [
				{ kind: "spend", amount: 9_000, at: new Date(2026, 10, 25, 12).toISOString() },
				{ kind: "income", amount: 50_000, at: new Date(2026, 10, 25, 12).toISOString() },
			],
		});
		const line = review.lines.find((item) => item.key === "money");
		expect(line?.value).toBe("Rs 9,000 spent");
		expect(line?.detail).toBe("Rs 2,000 over a week's share of your budget");
		expect(review.suggestions[0]).toContain("past the week's share");
	});

	test("sleep averages real nights and suggests winding down when short", () => {
		const review = buildReview({
			...empty,
			sleep: [
				{
					id: "2026-11-25",
					bedAt: new Date(2026, 10, 25, 1).toISOString(),
					wakeAt: new Date(2026, 10, 25, 6).toISOString(),
				},
			],
		});
		expect(review.lines[0]?.value).toBe("5.0 h a night");
		expect(review.suggestions[0]).toContain("winding down");
	});

	test("a good week gets one steady suggestion and at most three", () => {
		const good = buildReview({
			...empty,
			minimum: days.map((id) => ({ id, kept: 3, total: 3 })),
		});
		expect(good.suggestions).toEqual(["A steady week. Keep the same plan for the next one."]);
		const rough = buildReview({
			...empty,
			hasCare: true,
			prayers: Array.from({ length: 5 }, () => ({ day: days[2] ?? "", status: "missed" as const })),
			water: [{ id: days[3] ?? "", ml: 500 }],
			waterGoalMl: 2500,
			minimum: [{ id: days[1] ?? "", kept: 0, total: 3 }],
		});
		expect(rough.suggestions).toHaveLength(3);
	});

	test("today's minimum day only counts once it's kept", () => {
		const today = days[6] ?? "";
		const open = buildReview({ ...empty, minimum: [{ id: today, kept: 1, total: 3 }] });
		expect(open.lines).toEqual([]);
		const kept = buildReview({ ...empty, minimum: [{ id: today, kept: 3, total: 3 }] });
		expect(kept.lines[0]?.value).toBe("Kept 1 of 1");
	});
});
