import { dayKey, monthKey } from "@/lib/day";
import { CURRENCY, moneyParts } from "@/lib/money";
import {
	EXPENSE_CATEGORIES,
	type Expense,
	type ExpenseCategory,
	type SavingsGoal,
} from "./finance-model";

/** Rupee sums kept to whole paisa so 0.1 + 0.2 never shows as 0.30000000004. */
export function roundCents(value: number): number {
	return Math.round(value * 100) / 100;
}

export function sumAmounts(items: readonly { amount: number }[]): number {
	let total = 0;
	for (const item of items) total += item.amount;
	return roundCents(total);
}

export function expensesInMonth(expenses: readonly Expense[], now: Date): Expense[] {
	const key = monthKey(now);
	return expenses.filter((expense) => monthKey(new Date(expense.date)) === key);
}

export function expensesOnDay(expenses: readonly Expense[], day: Date): Expense[] {
	const key = dayKey(day);
	return expenses.filter((expense) => dayKey(new Date(expense.date)) === key);
}

export function spentThisMonth(expenses: readonly Expense[], now: Date): number {
	return sumAmounts(expensesInMonth(expenses, now));
}

export function daysInMonth(date: Date): number {
	return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/** Budget minus what was spent this month; negative when over budget, null with no budget. */
export function leftToSpend(budget: number | null, spent: number): number | null {
	return budget === null ? null : roundCents(budget - spent);
}

/** The monthly budget spread evenly over the days of this month. */
export function dailyBudget(budget: number | null, now: Date): number | null {
	return budget === null ? null : roundCents(budget / daysInMonth(now));
}

/** Whole percent of `of`; null when there is nothing to compare against. */
export function percentOf(value: number, of: number | null): number | null {
	if (of === null || of <= 0) return null;
	return Math.round((value / of) * 100);
}

export type CategoryTotal = { category: ExpenseCategory; amount: number };

/** Totals per category in the fixed Figma order, only categories with spending. */
export function categoryTotals(expenses: readonly Expense[]): CategoryTotal[] {
	const out: CategoryTotal[] = [];
	for (const category of EXPENSE_CATEGORIES) {
		const amount = sumAmounts(expenses.filter((expense) => expense.category === category));
		if (amount > 0) out.push({ category, amount });
	}
	return out;
}

/**
 * The segmented bar: `count` ticks, coloured by category in proportion to `scale` (today's daily
 * budget, or today's total when there is no budget). Ticks past the spending stay null (grey).
 * Every category with spending keeps at least one tick when there is room.
 */
export function spendTicks(
	totals: readonly CategoryTotal[],
	scale: number | null,
	count: number,
): (ExpenseCategory | null)[] {
	const total = sumAmounts(totals);
	const ticks: (ExpenseCategory | null)[] = Array.from({ length: Math.max(0, count) }, () => null);
	if (total <= 0 || count <= 0) return ticks;
	const range = Math.max(scale ?? total, total);
	const filled = Math.max(1, Math.min(count, Math.round((total / range) * count)));

	const raw = totals.map((item) => (item.amount / total) * filled);
	const shares = raw.map((value) => Math.floor(value));
	let left = filled - shares.reduce((a, b) => a + b, 0);
	const order = raw
		.map((value, index) => ({ index, rest: value - Math.floor(value) }))
		.sort((a, b) => b.rest - a.rest);
	for (const { index } of order) {
		if (left <= 0) break;
		shares[index] = (shares[index] ?? 0) + 1;
		left -= 1;
	}
	for (let i = 0; i < shares.length; i += 1) {
		if ((shares[i] ?? 0) > 0) continue;
		let biggest = -1;
		for (let j = 0; j < shares.length; j += 1) {
			if ((shares[j] ?? 0) > 1 && (biggest < 0 || (shares[j] ?? 0) > (shares[biggest] ?? 0)))
				biggest = j;
		}
		if (biggest < 0) break;
		shares[biggest] = (shares[biggest] ?? 0) - 1;
		shares[i] = 1;
	}

	let position = 0;
	totals.forEach((item, index) => {
		for (let n = 0; n < (shares[index] ?? 0) && position < count; n += 1) {
			ticks[position] = item.category;
			position += 1;
		}
	});
	return ticks;
}

export type DailyRange = {
	/** Average spend per day since the first entry this month (or the 1st). */
	average: number;
	low: number;
	peak: number;
	today: number;
	/** How many days the average covers. */
	days: number;
};

/** Daily totals this month, from the first logged day through today. Null with no entries. */
export function dailyRange(expenses: readonly Expense[], now: Date): DailyRange | null {
	const today = now.getDate();
	const month = expensesInMonth(expenses, now).filter(
		(expense) => new Date(expense.date).getDate() <= today,
	);
	if (month.length === 0) return null;

	let first = today;
	const perDay = new Map<number, number>();
	for (const expense of month) {
		const day = new Date(expense.date).getDate();
		first = Math.min(first, day);
		perDay.set(day, (perDay.get(day) ?? 0) + expense.amount);
	}

	let sum = 0;
	let low = Number.POSITIVE_INFINITY;
	let peak = 0;
	for (let day = first; day <= today; day += 1) {
		const total = roundCents(perDay.get(day) ?? 0);
		sum += total;
		low = Math.min(low, total);
		peak = Math.max(peak, total);
	}
	const days = today - first + 1;
	return {
		average: roundCents(sum / days),
		low,
		peak,
		today: roundCents(perDay.get(today) ?? 0),
		days,
	};
}

/** Where `value` sits between low and peak, 0…1 (the middle when every day was the same). */
export function rangePosition(value: number, low: number, peak: number): number {
	if (peak <= low) return 0.5;
	return Math.min(1, Math.max(0, (value - low) / (peak - low)));
}

export function lastEntryDate(expenses: readonly Expense[]): Date | null {
	let latest: number | null = null;
	for (const expense of expenses) {
		const time = new Date(expense.date).getTime();
		if (latest === null || time > latest) latest = time;
	}
	return latest === null ? null : new Date(latest);
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "Just now", "2 min ago", "3 h ago", "Yesterday", "4 days ago". */
export function relativeTime(from: Date, now: Date): string {
	const diff = Math.max(0, now.getTime() - from.getTime());
	if (diff < MINUTE) return "Just now";
	if (diff < HOUR) return `${Math.floor(diff / MINUTE)} min ago`;
	if (dayKey(from) === dayKey(now)) return `${Math.floor(diff / HOUR)} h ago`;
	const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
	const startOfFrom = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
	const days = Math.round((startOfToday - startOfFrom) / DAY);
	return days <= 1 ? "Yesterday" : `${days} days ago`;
}

export type SavingsProgress = {
	saved: number;
	target: number;
	/** 0…100, capped. */
	percent: number;
	addedThisMonth: number;
	/** Growth of the saved total since the end of last month; null when nothing was saved before. */
	changePercent: number | null;
};

export function savingsProgress(goal: SavingsGoal, now: Date): SavingsProgress {
	const saved = sumAmounts(goal.contributions);
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
	const before = sumAmounts(
		goal.contributions.filter((item) => new Date(item.date).getTime() < startOfMonth),
	);
	const addedThisMonth = roundCents(saved - before);
	return {
		saved,
		target: goal.target,
		percent: goal.target > 0 ? Math.min(100, Math.round((saved / goal.target) * 100)) : 0,
		addedThisMonth,
		changePercent: before > 0 ? Math.round((addedThisMonth / before) * 1000) / 10 : null,
	};
}

/** "1,180" — whole rupees with separators, for compact labels. */
export function wholeAmount(value: number): string {
	return Math.round(value).toLocaleString("en-US");
}

export type MoneySplit = { symbol: string; number: string; decimal: string };

/** "Rs" · "42,300" · ".00", for layouts that style each part (the Money card). */
export function moneySplit(amount: number): MoneySplit {
	const { whole, decimal } = moneyParts(amount, "");
	return { symbol: CURRENCY.symbol, number: whole.trim(), decimal };
}
