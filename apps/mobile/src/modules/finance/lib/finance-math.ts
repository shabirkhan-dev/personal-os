import type { ColorTokens } from "@personal-os/tokens";
import { addDays, dayKey, monthKey } from "@/lib/day";
import { formatMoney } from "@/lib/money";
import {
	type Bill,
	CATEGORIES,
	type Category,
	CATEGORY_SHORT,
	type Entry,
	type FinanceSettings,
	type Source,
} from "./finance-model";

/** Runway, budget pace, bills, history and the notes Finance Insights shows. */

const DAY_MS = 86_400_000;
/** A month counted as 30 days, so a monthly cost becomes a daily burn. */
export const MONTH_DAYS = 30;
export const MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// --- money --------------------------------------------------------------------------------------

export function roundCents(value: number): number {
	return Math.round(value * 100) / 100;
}

export function total(items: readonly { amount: number }[]): number {
	let sum = 0;
	for (const item of items) sum += item.amount;
	return roundCents(sum);
}

/** "Rs 148,500" without the paisa. */
export function rupees(amount: number): string {
	return formatMoney(Math.round(amount));
}

/** "55k", "31.2k", "1.5L"-free short form the Figma uses: "Rs 31.2k". */
export function shortK(amount: number): string {
	const value = Math.abs(amount);
	if (value < 1000) return String(Math.round(amount));
	const k = value / 1000;
	const text = k >= 100 ? String(Math.round(k)) : k.toFixed(1).replace(/\.0$/, "");
	return `${amount < 0 ? "−" : ""}${text}k`;
}

/** "– Rs 1,680" for money out, "+ Rs 45,000" for money in. */
export function signed(entry: Pick<Entry, "kind" | "amount">): string {
	return `${entry.kind === "income" ? "+" : "–"} ${formatMoney(entry.amount)}`;
}

// --- entries ------------------------------------------------------------------------------------

export const spends = (entries: readonly Entry[]) =>
	entries.filter((entry) => entry.kind === "spend");
export const incomes = (entries: readonly Entry[]) =>
	entries.filter((entry) => entry.kind === "income");

/** Entries in the month `offset` months from `now` (0 this month, -1 last month). */
export function inMonth(entries: readonly Entry[], now: Date, offset = 0): Entry[] {
	const key = monthKey(new Date(now.getFullYear(), now.getMonth() + offset, 1));
	return entries.filter((entry) => monthKey(new Date(entry.at)) === key);
}

export function inYear(entries: readonly Entry[], now: Date): Entry[] {
	const year = now.getFullYear();
	return entries.filter((entry) => new Date(entry.at).getFullYear() === year);
}

export function onDay(entries: readonly Entry[], day: Date): Entry[] {
	const key = dayKey(day);
	return entries.filter((entry) => dayKey(new Date(entry.at)) === key);
}

export function byCategory(entries: readonly Entry[]): Record<Category, number> {
	const sums = {} as Record<Category, number>;
	for (const category of CATEGORIES) sums[category] = 0;
	for (const entry of spends(entries)) sums[entry.category] += entry.amount;
	for (const category of CATEGORIES) sums[category] = roundCents(sums[category]);
	return sums;
}

/** Money on hand: what was set, plus income and minus spending since then. */
export function balanceNow(settings: FinanceSettings, entries: readonly Entry[]): number {
	const since = Date.parse(settings.balanceAt);
	let balance = settings.balance;
	for (const entry of entries) {
		if (Date.parse(entry.at) <= since) continue;
		balance += entry.kind === "income" ? entry.amount : -entry.amount;
	}
	return roundCents(balance);
}

// --- runway -------------------------------------------------------------------------------------

export const minimumTotal = (settings: FinanceSettings) => total(settings.minimum);
export const budgetTotal = (limits: Record<Category, number>) =>
	roundCents(CATEGORIES.reduce((sum, category) => sum + limits[category], 0));

/** What a month costs for the runway: the minimum while it is protected. */
export function monthlyCost(settings: FinanceSettings): number {
	return settings.protect ? minimumTotal(settings) : settings.monthlyCost;
}

/** Monthly burn after fixed income; 0 when income covers the month. */
export function monthlyBurn(settings: FinanceSettings, cut = 0): number {
	return Math.max(0, monthlyCost(settings) - cut - settings.monthlyIncome);
}

/** Whole days the money lasts; null when nothing is burning. */
export function runwayDays(balance: number, burn: number): number | null {
	if (burn <= 0) return null;
	return Math.max(0, Math.floor(balance / (burn / MONTH_DAYS)));
}

export type Scenario = { jobFrom: Date | null; cut: number };
export const NOW_SCENARIO: Scenario = { jobFrom: null, cut: 0 };

export type Projection = {
	/** Today, then the 1st of each month that follows. */
	points: { at: Date; balance: number }[];
	/** When the money reaches zero; null when it never does within two years. */
	runsOut: Date | null;
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const firstOfMonth = (date: Date, offset: number) =>
	new Date(date.getFullYear(), date.getMonth() + offset, 1);

/** Day by day from today: monthly burn, fixed income and, from `jobFrom`, the salary. */
export function project(
	balance: number,
	settings: FinanceSettings,
	now: Date,
	scenario: Scenario = NOW_SCENARIO,
	months = 3,
): Projection {
	const today = startOfDay(now);
	const cost = Math.max(0, monthlyCost(settings) - scenario.cut);
	const pay = settings.salary > 0 ? settings.salary : monthlyCost(settings);
	const jobFrom = scenario.jobFrom ? startOfDay(scenario.jobFrom).getTime() : null;
	const dayNet = (time: number) =>
		(settings.monthlyIncome + (jobFrom !== null && time >= jobFrom ? pay : 0) - cost) / MONTH_DAYS;
	const at = (target: Date) => {
		let value = balance;
		for (let time = today.getTime(); time < target.getTime(); time += DAY_MS) value += dayNet(time);
		return Math.max(0, Math.round(value));
	};
	const points = [{ at: today, balance: Math.round(balance) }];
	for (let step = 1; step <= months; step += 1) {
		const first = firstOfMonth(today, step);
		points.push({ at: first, balance: at(first) });
	}
	if (balance <= 0) return { points, runsOut: today };
	let runsOut: Date | null = null;
	let value = balance;
	for (let day = 0; day < 730; day += 1) {
		const time = today.getTime() + day * DAY_MS;
		value += dayNet(time);
		if (value <= 0) {
			runsOut = new Date(time + DAY_MS);
			break;
		}
	}
	return { points, runsOut };
}

/** Blue with two months or more, yellow with one, red below. */
export function balanceTone(balance: number, cost: number): keyof ColorTokens {
	if (cost <= 0 || balance >= cost * 2) return "accentDefault";
	if (balance >= cost) return "statusCaution";
	return "statusDanger";
}

/** "early December", "mid December", "late December". */
export function partOfMonth(date: Date): string {
	const day = date.getDate();
	const part = day <= 10 ? "early" : day <= 20 ? "mid" : "late";
	return `${part} ${MONTHS[date.getMonth()]}`;
}

/** The line under the runway bars. */
export function bufferLine(balance: number, settings: FinanceSettings, now: Date): string {
	const burn = monthlyBurn(settings);
	const cost = monthlyCost(settings);
	if (burn <= 0) return "Income covers the month. Everything else is buffer.";
	if (balance <= cost) return "Less than a month of buffer left. Protect the minimum.";
	const days = Math.floor((balance - cost) / (burn / MONTH_DAYS));
	return `A job by ${partOfMonth(addDays(now, days))} keeps a full month of buffer`;
}

export function shortDate(date: Date): string {
	return `${date.getDate()} ${MONTHS[date.getMonth()]?.slice(0, 3)}`;
}

export function longDate(date: Date): string {
	return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

// --- budget -------------------------------------------------------------------------------------

export function daysInMonth(date: Date): number {
	return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export type Pace = {
	spent: number;
	budget: number;
	spentShare: number;
	monthShare: number;
	state: "on track" | "ahead" | "over";
	daysLeft: number;
	perDay: number;
};

/** This month's spending against the budget and how far through the month we are. */
export function pace(spent: number, budget: number, now: Date): Pace {
	const days = daysInMonth(now);
	const daysLeft = days - now.getDate() + 1;
	const monthShare = (now.getDate() - 1 + now.getHours() / 24) / days;
	const spentShare = budget > 0 ? spent / budget : 0;
	const state =
		budget > 0 && spent > budget
			? "over"
			: spentShare > monthShare + 0.1
				? "ahead"
				: ("on track" as const);
	return {
		spent,
		budget,
		spentShare,
		monthShare,
		state,
		daysLeft,
		perDay: daysLeft > 0 ? Math.max(0, (budget - spent) / daysLeft) : 0,
	};
}

// --- bills --------------------------------------------------------------------------------------

export function dueIn(bill: Bill, year: number, month: number): Date {
	const last = new Date(year, month + 1, 0).getDate();
	return new Date(year, month, Math.min(bill.dueDay, last));
}

export type DueBill = { bill: Bill; due: Date; overdue: boolean };

/** Bills not paid yet: this month's if unpaid, otherwise next month's. Soonest first. */
export function upcomingBills(bills: readonly Bill[], now: Date): DueBill[] {
	const today = startOfDay(now);
	const thisMonth = monthKey(now);
	return bills
		.map((bill) => {
			const due = dueIn(bill, now.getFullYear(), now.getMonth());
			if (!bill.paid.includes(thisMonth)) return { bill, due, overdue: due < today };
			return { bill, due: dueIn(bill, now.getFullYear(), now.getMonth() + 1), overdue: false };
		})
		.sort((a, b) => a.due.getTime() - b.due.getTime());
}

/** "Sat 18 Oct". */
export function dayLabel(date: Date): string {
	return `${WEEKDAYS[date.getDay()]} ${shortDate(date)}`;
}

// --- halal --------------------------------------------------------------------------------------

/** Interest that came in and has not been given away yet. */
export function interestOwed(entries: readonly Entry[]): number {
	let owed = 0;
	for (const entry of entries) {
		if (entry.kind === "income" && !entry.clean) owed += entry.amount;
		if (entry.kind === "spend" && entry.purify) owed -= entry.amount;
	}
	return Math.max(0, roundCents(owed));
}

export type SourceTotal = { source: Source; amount: number; lastAt: string | null };

/** Income per source over the last `days` days, every source listed even at zero. */
export function sourceTotals(
	entries: readonly Entry[],
	sources: readonly Source[],
	now: Date,
	days = 90,
): SourceTotal[] {
	const since = now.getTime() - days * DAY_MS;
	return sources
		.map((source) => {
			const mine = incomes(entries).filter((entry) => entry.sourceId === source.id);
			const recent = mine.filter((entry) => Date.parse(entry.at) >= since);
			return {
				source,
				amount: total(recent),
				lastAt:
					mine
						.map((entry) => entry.at)
						.sort()
						.at(-1) ?? null,
			};
		})
		.sort((a, b) => b.amount - a.amount);
}

// --- history ------------------------------------------------------------------------------------

export type DayGroup = { day: string; entries: Entry[]; net: number };

/** Entries by day, newest first, each day with money in minus money out. */
export function dayGroups(entries: readonly Entry[]): DayGroup[] {
	const groups = new Map<string, Entry[]>();
	for (const entry of entries) {
		const day = dayKey(new Date(entry.at));
		const list = groups.get(day) ?? [];
		list.push(entry);
		groups.set(day, list);
	}
	return [...groups.entries()]
		.sort((a, b) => b[0].localeCompare(a[0]))
		.map(([day, list]) => {
			const sorted = [...list].sort((a, b) => b.at.localeCompare(a.at));
			return {
				day,
				entries: sorted,
				net: roundCents(total(incomes(sorted)) - total(spends(sorted))),
			};
		});
}

/** "Today", "Yesterday", "Mon 13 Oct". */
export function dayTitle(day: string, now: Date): string {
	if (day === dayKey(now)) return "Today";
	if (day === dayKey(addDays(now, -1))) return "Yesterday";
	return dayLabel(new Date(`${day}T12:00:00`));
}

const clockOf = (date: Date) =>
	`${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

/** "Food · chicken, milk · 18:20", "Income · halal ✓ · yesterday". */
export function entryLine(entry: Entry, now: Date, withWhen = true): string {
	const date = new Date(entry.at);
	const day = dayKey(date);
	const when =
		day === dayKey(now)
			? clockOf(date)
			: day === dayKey(addDays(now, -1))
				? "yesterday"
				: shortDate(date);
	const head =
		entry.kind === "income"
			? `Income · ${entry.clean ? "halal ✓" : "interest"}`
			: CATEGORY_SHORT[entry.category];
	return [head, entry.note, withWhen ? when : ""].filter(Boolean).join(" · ");
}

// --- insights -----------------------------------------------------------------------------------

export type FinanceNote =
	| { kind: "big-bill"; name: string; amount: number; due: Date }
	| { kind: "job-search"; weekly: number }
	| { kind: "interest"; amount: number }
	| { kind: "ahead"; category: Category; spent: number; limit: number; daysLeft: number }
	| { kind: "food"; share: number };

/** What's worth acting on this month, most useful first. */
export function financeNotes(input: {
	settings: FinanceSettings;
	entries: readonly Entry[];
	bills: readonly Bill[];
	now: Date;
}): FinanceNote[] {
	const { settings, entries, bills, now } = input;
	const notes: FinanceNote[] = [];
	const month = inMonth(entries, now);
	const sums = byCategory(month);
	const spent = total(spends(month));
	const monthPace = pace(spent, budgetTotal(settings.limits), now);

	const ahead = CATEGORIES.map((category) => ({
		category,
		spent: sums[category],
		limit: settings.limits[category],
	}))
		.filter((item) => item.limit > 0 && item.spent / item.limit > monthPace.monthShare + 0.25)
		.sort((a, b) => b.spent / b.limit - a.spent / a.limit)[0];
	if (ahead) notes.push({ kind: "ahead", ...ahead, daysLeft: monthPace.daysLeft });

	const soon = upcomingBills(bills, now).filter(
		(item) =>
			item.due.getTime() - now.getTime() < 31 * DAY_MS &&
			item.bill.amount >= Math.max(1000, settings.monthlyCost * 0.08),
	);
	const big = [...soon].sort((a, b) => b.bill.amount - a.bill.amount)[0];
	if (big)
		notes.push({ kind: "big-bill", name: big.bill.name, amount: big.bill.amount, due: big.due });

	if (spent > 0 && sums.food / spent >= 0.4) notes.push({ kind: "food", share: sums.food / spent });

	if (settings.setUp && settings.monthlyIncome <= 0) {
		notes.push({ kind: "job-search", weekly: Math.round((monthlyCost(settings) * 12) / 52) });
	}

	const owed = interestOwed(entries);
	if (owed > 0) notes.push({ kind: "interest", amount: owed });
	return notes;
}

export type Recap = {
	spent: number;
	income: number;
	/** Runway days the period's income bought. */
	daysAdded: number;
	interest: number;
	pace: Pace["state"] | null;
};

export function recap(
	entries: readonly Entry[],
	settings: FinanceSettings,
	now: Date,
	range: "month" | "last" | "year",
): Recap {
	const list =
		range === "year" ? inYear(entries, now) : inMonth(entries, now, range === "last" ? -1 : 0);
	const spent = total(spends(list));
	const income = total(incomes(list));
	const burn = monthlyBurn(settings);
	const budget = budgetTotal(settings.limits);
	return {
		spent,
		income,
		daysAdded: burn > 0 ? Math.floor(income / (burn / MONTH_DAYS)) : 0,
		interest: total(incomes(list).filter((entry) => !entry.clean)),
		pace:
			range === "month"
				? pace(spent, budget, now).state
				: range === "last"
					? spent > budget
						? "over"
						: "on track"
					: spent > budget * 12
						? "over"
						: null,
	};
}

/** Savings toward the after-the-job goal, 0–1. */
export function savedShare(settings: FinanceSettings): number {
	return settings.savingsTarget > 0 ? Math.min(1, settings.saved / settings.savingsTarget) : 0;
}
