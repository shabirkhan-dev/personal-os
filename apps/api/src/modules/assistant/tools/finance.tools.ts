import type { Card, ListItem, Tone } from "@personal-os/domain/assistant";
import { monthKey, newId } from "@personal-os/domain/dates";
import {
	type Bill,
	balanceNow,
	budgetTotal,
	byCategory,
	CATEGORIES,
	CATEGORY_SHORT,
	type Category,
	defaultSettings,
	type Entry,
	type FinanceSettings,
	inMonth,
	incomes,
	METHODS,
	monthLimits,
	monthlyBurn,
	pace,
	parseBill,
	parseEntry,
	parseSettings,
	payBillOps,
	runwayDays,
	SPEND_CATEGORIES,
	spendEntry,
	spends,
	newEntry,
	total,
	unpaidBill,
	upcomingBills,
} from "@personal-os/domain/finance";
import * as z from "zod";

import { listRecords, putRecord } from "../assistant.records";
import { localClock, zonedToDate } from "../assistant.time";
import { defineTool, type ToolContext, ToolError, type UndoWrite } from "../assistant.tool";

const SETTINGS = "finance-settings";
const ENTRIES = "finance-entries";
const BILLS = "finance-bills";

/** "Rs 148,500", "−Rs 5,000". */
export function rupees(amount: number): string {
	const whole = Math.round(Math.abs(amount)).toLocaleString("en-US");
	return `${amount < 0 ? "−" : ""}Rs ${whole}`;
}

const DAY_FORMAT = { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" } as const;
/** A shifted (local) date as "Mon 2 Nov". */
const dayLabel = (date: Date) => date.toLocaleDateString("en-GB", DAY_FORMAT);

/**
 * Finance's records on the person's clock: entry times and the balance date moved into their
 * zone, so the shared math reads their own days and months (see `localClock`).
 */
async function load(ctx: ToolContext) {
	const clock = localClock(ctx.now, ctx.context.timeZone);
	const [settingsRows, entryRows, bills] = await Promise.all([
		listRecords(ctx.db, ctx.userId, SETTINGS, parseSettings),
		listRecords(ctx.db, ctx.userId, ENTRIES, parseEntry),
		listRecords(ctx.db, ctx.userId, BILLS, parseBill),
	]);
	const stored = settingsRows[0] ?? defaultSettings(ctx.now);
	const settings: FinanceSettings = { ...stored, balanceAt: clock.shift(stored.balanceAt) };
	const entries = entryRows.map((entry) => ({ ...entry, at: clock.shift(entry.at) }));
	return { clock, now: clock.now, stored, settings, entries, storedEntries: entryRows, bills };
}

const lineTone = (used: number, limit: number): Tone =>
	limit > 0 && used > limit ? "danger" : limit > 0 && used > limit * 0.85 ? "caution" : "accent";

function entryItem(entry: Entry): ListItem {
	return {
		id: entry.id,
		title: entry.title,
		subtitle: `${entry.kind === "income" ? "Income" : CATEGORY_SHORT[entry.category]} · ${dayLabel(new Date(entry.at))}`,
		value: `${entry.kind === "income" ? "+" : "–"} ${rupees(entry.amount)}`,
		tone: entry.kind === "income" ? "success" : "neutral",
		link: { screen: "finance-history" },
	};
}

/** What the model reads for an entry. */
const entryBrief = (entry: Entry) => ({
	id: entry.id,
	kind: entry.kind,
	amount: entry.amount,
	title: entry.title,
	line: entry.kind === "spend" ? entry.category : undefined,
	day: entry.at.slice(0, 10),
});

async function findBill(ctx: ToolContext, bills: readonly Bill[], ref: string): Promise<Bill> {
	const byId = bills.find((bill) => bill.id === ref);
	if (byId) return byId;
	const words = ref.toLowerCase().split(/\s+/).filter(Boolean);
	const matches = bills.filter((bill) =>
		words.every((word) => `${bill.name} ${bill.provider}`.toLowerCase().includes(word)),
	);
	const [only, ...rest] = matches;
	if (only && rest.length === 0) return only;
	throw new ToolError(
		matches.length > 1
			? `More than one bill matches "${ref}". Ask which one.`
			: `No bill matches "${ref}".`,
		{
			bills: (matches.length > 1 ? matches : bills)
				.slice(0, 10)
				.map((bill) => `${bill.name} (${rupees(bill.amount)}, day ${bill.dueDay})`),
		},
	);
}

const save = (ctx: ToolContext, collection: string, id: string, data: unknown, deleted = false) =>
	putRecord(ctx.db, ctx.userId, collection, id, data, ctx.now.getTime(), deleted);

const financeOverview = defineTool({
	name: "finance_overview",
	description:
		"Money now and how long it lasts (runway), this month's spending against the budget per line, income this month, and bills due soon or overdue. Call it first for any general money question ('how am I doing', 'can I afford', 'what's left').",
	input: z.object({}).strict(),
	effect: "read",
	label: () => "Checking your money",
	run: async (ctx) => {
		const { now, settings, entries, bills } = await load(ctx);
		if (!settings.setUp && entries.length === 0) {
			return {
				result: {
					setUp: false,
					note: "Finance isn't set up yet. Suggest setting it up in the app.",
				},
				cards: [{ kind: "link", label: "Set up Finance", link: { screen: "finance" } }],
			};
		}
		const balance = balanceNow(settings, entries);
		const burn = monthlyBurn(settings);
		const runway = runwayDays(balance, burn);
		const month = inMonth(entries, now);
		const spent = total(spends(month));
		const income = total(incomes(month));
		const limits = monthLimits(settings, entries, now);
		const budget = budgetTotal(limits);
		const progress = pace(spent, budget, now);
		const lines = byCategory(month);
		const soon = upcomingBills(bills, now).filter(
			(due) => due.overdue || due.due.getTime() - now.getTime() < 7 * 86_400_000,
		);

		const cards: Card[] = [
			{
				kind: "metric",
				label: "Money now",
				value: rupees(balance),
				detail:
					runway === null
						? "Income covers the month"
						: `Lasts about ${runway} days at ${rupees(burn)} a month`,
				tone:
					runway !== null && runway < 30
						? "danger"
						: runway !== null && runway < 90
							? "caution"
							: "success",
				link: { screen: "finance-runway" },
			},
			{
				kind: "progress",
				title: `This month · ${rupees(spent)} of ${rupees(budget)}`,
				items: CATEGORIES.filter((line) => limits[line] > 0 || lines[line] > 0).map((line) => ({
					label: CATEGORY_SHORT[line],
					used: lines[line],
					limit: limits[line],
					text: `${rupees(lines[line])} of ${rupees(limits[line])}`,
					tone: lineTone(lines[line], limits[line]),
				})),
			},
		];
		if (soon.length > 0) {
			cards.push({
				kind: "list",
				title: "Bills due",
				empty: "",
				items: soon.map(({ bill, due, overdue }) => ({
					id: bill.id,
					title: bill.name,
					subtitle: overdue ? `Overdue since ${dayLabel(due)}` : `Due ${dayLabel(due)}`,
					value: rupees(bill.amount),
					tone: overdue ? "danger" : "caution",
					link: { screen: "finance" },
				})),
			});
		}
		if (progress.state !== "on track") {
			cards.push({
				kind: "callout",
				tone: progress.state === "over" ? "danger" : "caution",
				title: progress.state === "over" ? "Over budget this month" : "Spending ahead of the month",
				text: `${Math.round(progress.spentShare * 100)}% of the budget is gone with ${Math.round(progress.monthShare * 100)}% of the month passed. About ${rupees(progress.perDay)} a day is left.`,
			});
		}
		return {
			result: {
				balance,
				monthlyBurn: burn,
				runwayDays: runway,
				thisMonth: {
					spent,
					income,
					budget,
					state: progress.state,
					perDayLeft: Math.round(progress.perDay),
					daysLeft: progress.daysLeft,
				},
				lines: Object.fromEntries(
					CATEGORIES.filter((line) => limits[line] > 0 || lines[line] > 0).map((line) => [
						line,
						{ spent: lines[line], limit: limits[line] },
					]),
				),
				billsDue: soon.map(({ bill, due, overdue }) => ({
					id: bill.id,
					name: bill.name,
					amount: bill.amount,
					due: due.toISOString().slice(0, 10),
					overdue,
				})),
				protectMinimum: settings.protect,
			},
			cards,
		};
	},
});

const findEntries = defineTool({
	name: "find_entries",
	description:
		"Lists money entries (spending and income), newest first, filtered by words in the title, kind, budget line or dates. Returns the total too. Use it for 'what did I spend on…', 'how much on food last week', or to find an entry before deleting it.",
	input: z
		.object({
			query: z.string().trim().max(60).optional(),
			kind: z.enum(["spend", "income"]).optional(),
			line: z.enum(CATEGORIES).optional().describe("Budget line."),
			from: z.iso.date().optional().describe("First day, 'YYYY-MM-DD' in the person's zone."),
			to: z.iso.date().optional().describe("Last day, included."),
			limit: z.number().int().min(1).max(30).default(12),
		})
		.strict(),
	effect: "read",
	label: () => "Looking through your money",
	run: async (ctx, input) => {
		const { entries } = await load(ctx);
		const words = (input.query ?? "").toLowerCase().split(/\s+/).filter(Boolean);
		const found = entries
			.filter((entry) => !input.kind || entry.kind === input.kind)
			.filter((entry) => !input.line || (entry.kind === "spend" && entry.category === input.line))
			.filter((entry) => !input.from || entry.at.slice(0, 10) >= input.from)
			.filter((entry) => !input.to || entry.at.slice(0, 10) <= input.to)
			.filter((entry) =>
				words.every((word) => `${entry.title} ${entry.note}`.toLowerCase().includes(word)),
			)
			.toSorted((a, b) => b.at.localeCompare(a.at));
		const shown = found.slice(0, input.limit);
		const spent = total(spends(found));
		const earned = total(incomes(found));
		return {
			result: { count: found.length, spent, earned, entries: shown.map(entryBrief) },
			cards: [
				{
					kind: "list",
					title: `${found.length} entries${spent ? ` · ${rupees(spent)} out` : ""}${earned ? ` · ${rupees(earned)} in` : ""}`,
					items: shown.map(entryItem),
					empty: "Nothing matches.",
					more: found.length > shown.length ? { screen: "finance-history" } : undefined,
				},
			],
		};
	},
});

const spendingBreakdown = defineTool({
	name: "spending_breakdown",
	description:
		"A chart of one month's spending, by budget line or by day, with last month's total to compare. Use it when the person asks where money went or wants to see a month.",
	input: z
		.object({
			month: z
				.string()
				.regex(/^\d{4}-\d{2}$/)
				.optional()
				.describe("'YYYY-MM'; this month when omitted."),
			by: z.enum(["line", "day"]).default("line"),
		})
		.strict(),
	effect: "read",
	label: () => "Adding up your spending",
	run: async (ctx, input) => {
		const { now, entries } = await load(ctx);
		const [year, month] = (input.month ?? monthKey(now)).split("-").map(Number) as [number, number];
		const anchor = new Date(Date.UTC(year, month - 1, 15));
		const these = spends(inMonth(entries, anchor));
		const last = total(spends(inMonth(entries, anchor, -1)));
		const sum = total(these);
		const title = anchor.toLocaleDateString("en-GB", {
			month: "long",
			year: "numeric",
			timeZone: "UTC",
		});
		let points: { label: string; value: number; display: string }[];
		if (input.by === "line") {
			const lines = byCategory(these);
			points = CATEGORIES.filter((line) => lines[line] > 0)
				.toSorted((a, b) => lines[b] - lines[a])
				.map((line) => ({
					label: CATEGORY_SHORT[line],
					value: lines[line],
					display: rupees(lines[line]),
				}));
		} else {
			const days = new Map<string, number>();
			for (const entry of these)
				days.set(entry.at.slice(8, 10), (days.get(entry.at.slice(8, 10)) ?? 0) + entry.amount);
			points = [...days.entries()]
				.toSorted(([a], [b]) => a.localeCompare(b))
				.map(([day, value]) => ({ label: String(Number(day)), value, display: rupees(value) }));
		}
		const change = last > 0 ? Math.round(((sum - last) / last) * 100) : null;
		return {
			result: {
				month: input.month ?? monthKey(now),
				spent: sum,
				lastMonth: last,
				changePercent: change,
				points: points.map(({ label, value }) => ({ label, value })),
			},
			cards: [
				{
					kind: "chart",
					title: `${title} · ${rupees(sum)}`,
					style: input.by === "line" ? "bars" : "columns",
					unit: "Rs",
					points,
					note:
						change === null
							? undefined
							: `${change >= 0 ? "Up" : "Down"} ${Math.abs(change)}% on the month before (${rupees(last)}).`,
				},
			],
		};
	},
});

const listBills = defineTool({
	name: "list_bills",
	description: "Every bill with its amount, due day and whether this month's is paid or overdue.",
	input: z.object({}).strict(),
	effect: "read",
	label: () => "Checking your bills",
	run: async (ctx) => {
		const { now, bills } = await load(ctx);
		const due = upcomingBills(bills, now);
		return {
			result: due.map(({ bill, due: day, overdue }) => ({
				id: bill.id,
				name: bill.name,
				amount: bill.amount,
				dueDay: bill.dueDay,
				nextDue: day.toISOString().slice(0, 10),
				overdue,
			})),
			cards: [
				{
					kind: "list",
					title: `Bills · ${rupees(total(bills))} a month`,
					empty: "No bills yet.",
					items: due.map(({ bill, due: day, overdue }) => ({
						id: bill.id,
						title: bill.name,
						subtitle: `${overdue ? "Overdue since" : "Next due"} ${dayLabel(day)}${bill.provider ? ` · ${bill.provider}` : ""}`,
						value: rupees(bill.amount),
						tone: overdue ? "danger" : "neutral",
						link: { screen: "finance" },
					})),
				},
			],
		};
	},
});

const logSpending = defineTool({
	name: "log_spending",
	description:
		"Logs money spent, one entry per item, on a budget line: food, bills, transport, care, giving, shopping or other. Pick the line from what was bought. Today unless a date is given.",
	input: z
		.object({
			items: z
				.array(
					z.object({
						amount: z.number().positive().max(100_000_000),
						title: z.string().trim().min(1).max(80).describe("'Lunch', 'Uber to office'."),
						line: z.enum(SPEND_CATEGORIES),
					}),
				)
				.min(1)
				.max(10),
			method: z.enum(METHODS).default("cash"),
			on: z.iso
				.date()
				.optional()
				.describe("'YYYY-MM-DD' in the person's zone; today when omitted."),
		})
		.strict(),
	effect: "write",
	label: (input) =>
		input.items.length === 1
			? `Logging ${input.items[0]?.title}`
			: `Logging ${input.items.length} items`,
	describe: async (_ctx, input) => ({
		title: `Log ${rupees(input.items.reduce((sum, item) => sum + item.amount, 0))} spent`,
		detail: input.items
			.map((item) => `${item.title} ${rupees(item.amount)} (${CATEGORY_SHORT[item.line]})`)
			.join(" · "),
	}),
	run: async (ctx, input) => {
		const at = input.on
			? (zonedToDate(`${input.on}T12:00`, ctx.context.timeZone) ?? ctx.now)
			: ctx.now;
		const made = input.items.map((item) =>
			spendEntry(
				{ amount: item.amount, title: item.title, category: item.line, method: input.method },
				at,
			),
		);
		await Promise.all(made.map((entry) => save(ctx, ENTRIES, entry.id, entry)));
		const { clock } = await load(ctx);
		return {
			result: { logged: made.map(entryBrief) },
			cards: [
				{
					kind: "list",
					title: "Logged",
					empty: "",
					items: made.map((entry) => entryItem({ ...entry, at: clock.shift(entry.at) })),
				},
			],
			changed: [ENTRIES],
			undo: made.map((entry) => ({ collection: ENTRIES, id: entry.id, previous: null })),
		};
	},
});

const logIncome = defineTool({
	name: "log_income",
	description:
		"Logs money received (salary, a client payment, a gift). Set clean to false only for interest (riba), which is kept apart to give away.",
	input: z
		.object({
			amount: z.number().positive().max(1_000_000_000),
			title: z.string().trim().min(1).max(80),
			from: z.string().trim().max(40).optional().describe("Who paid: 'Tessera', 'Freelance'."),
			clean: z.boolean().default(true),
		})
		.strict(),
	effect: "write",
	label: () => "Logging income",
	describe: async (_ctx, input) => ({
		title: `Log ${rupees(input.amount)} received`,
		detail: [input.title, input.from, input.clean ? null : "interest, to give away"]
			.filter(Boolean)
			.join(" · "),
	}),
	run: async (ctx, input) => {
		const entry = newEntry(
			{
				kind: "income",
				amount: input.amount,
				title: input.title,
				note: input.from ?? "",
				method: "bank",
				clean: input.clean,
			},
			ctx.now,
		);
		await save(ctx, ENTRIES, entry.id, entry);
		return {
			result: { logged: entryBrief(entry) },
			changed: [ENTRIES],
			undo: [{ collection: ENTRIES, id: entry.id, previous: null }],
		};
	},
});

const payBill = defineTool({
	name: "pay_bill",
	description:
		"Marks a bill paid: logs its payment and ticks the month it covers (the overdue month first, else this month's). Find the bill by name.",
	input: z
		.object({ bill: z.string().trim().min(1).max(60).describe("The bill's id or name.") })
		.strict(),
	effect: "write",
	label: () => "Paying the bill",
	describe: async (ctx, input) => {
		const { bills } = await load(ctx);
		const bill = await findBill(ctx, bills, input.bill);
		return { title: `Pay ${bill.name}`, detail: rupees(bill.amount) };
	},
	run: async (ctx, input) => {
		const { now, clock, bills } = await load(ctx);
		const bill = await findBill(ctx, bills, input.bill);
		const due = upcomingBills([bill], now)[0];
		if (!due) throw new ToolError("This bill has nothing due.");
		const paid = payBillOps(bill, due.due, ctx.now);
		await save(ctx, ENTRIES, paid.entry.id, paid.entry);
		await save(ctx, BILLS, bill.id, paid.bill);
		return {
			result: { paid: bill.name, amount: bill.amount, month: monthKey(due.due) },
			cards: [
				{
					kind: "list",
					title: "Paid",
					empty: "",
					items: [entryItem({ ...paid.entry, at: clock.shift(paid.entry.at) })],
				},
			],
			changed: [ENTRIES, BILLS],
			undo: [
				{ collection: ENTRIES, id: paid.entry.id, previous: null },
				{ collection: BILLS, id: bill.id, previous: bill },
			],
		};
	},
});

const addBill = defineTool({
	name: "add_bill",
	description:
		"Adds a monthly bill (electricity, internet, rent) with its amount and the day of the month it's due.",
	input: z
		.object({
			name: z.string().trim().min(1).max(40),
			amount: z.number().positive().max(100_000_000),
			dueDay: z.number().int().min(1).max(31),
			provider: z.string().trim().max(40).default(""),
			line: z.enum(SPEND_CATEGORIES).default("bills"),
		})
		.strict(),
	effect: "write",
	label: (input) => `Adding ${input.name}`,
	describe: async (_ctx, input) => ({
		title: `Add bill: ${input.name}`,
		detail: `${rupees(input.amount)} on day ${input.dueDay} each month`,
	}),
	run: async (ctx, input) => {
		const { now, bills } = await load(ctx);
		if (bills.some((bill) => bill.name.toLowerCase() === input.name.toLowerCase())) {
			throw new ToolError(`A bill named ${input.name} already exists.`);
		}
		const bill: Bill = {
			id: newId(),
			name: input.name,
			provider: input.provider,
			amount: input.amount,
			dueDay: input.dueDay,
			category: input.line as Category,
			paid: [],
			since: monthKey(now),
		};
		await save(ctx, BILLS, bill.id, bill);
		return {
			result: { added: bill.name },
			changed: [BILLS],
			undo: [{ collection: BILLS, id: bill.id, previous: null }],
		};
	},
});

const setBudgetLine = defineTool({
	name: "set_budget_line",
	description: "Sets the monthly limit of one budget line (food, transport…).",
	input: z
		.object({ line: z.enum(SPEND_CATEGORIES), limit: z.number().min(0).max(100_000_000) })
		.strict(),
	effect: "write",
	label: () => "Changing the budget",
	describe: async (ctx, input) => {
		const { stored } = await load(ctx);
		return {
			title: `${CATEGORY_SHORT[input.line]} budget to ${rupees(input.limit)}`,
			detail: `Was ${rupees(stored.limits[input.line])} a month`,
		};
	},
	run: async (ctx, input) => {
		const { stored } = await load(ctx);
		const next = { ...stored, limits: { ...stored.limits, [input.line]: input.limit } };
		await save(ctx, SETTINGS, "settings", next);
		return {
			result: { line: input.line, limit: input.limit },
			changed: [SETTINGS],
			undo: [{ collection: SETTINGS, id: "settings", previous: stored }],
		};
	},
});

const setBalance = defineTool({
	name: "set_balance",
	description:
		"Corrects the money on hand to an exact amount the person states (their real balance today). From now on the balance counts from this.",
	input: z.object({ balance: z.number().min(-1_000_000_000).max(1_000_000_000) }).strict(),
	effect: "risky",
	label: () => "Correcting your balance",
	describe: async (ctx, input) => {
		const { settings, entries } = await load(ctx);
		return {
			title: `Set money now to ${rupees(input.balance)}`,
			detail: `It shows ${rupees(balanceNow(settings, entries))} now`,
		};
	},
	run: async (ctx, input) => {
		const { stored } = await load(ctx);
		const next = {
			...stored,
			setUp: true,
			balance: input.balance,
			balanceAt: ctx.now.toISOString(),
		};
		await save(ctx, SETTINGS, "settings", next);
		return {
			result: { balance: input.balance },
			changed: [SETTINGS],
			undo: [{ collection: SETTINGS, id: "settings", previous: stored }],
		};
	},
});

const deleteEntry = defineTool({
	name: "delete_entry",
	description:
		"Deletes one money entry by id (find it with find_entries first). A bill payment's month goes back to unpaid.",
	input: z.object({ id: z.string().min(1).max(64) }).strict(),
	effect: "risky",
	label: () => "Deleting the entry",
	describe: async (ctx, input) => {
		const { storedEntries } = await load(ctx);
		const entry = storedEntries.find((each) => each.id === input.id);
		if (!entry) throw new ToolError("No entry has that id.");
		return {
			title: `Delete ${entry.title}`,
			detail: `${rupees(entry.amount)} on ${entry.at.slice(0, 10)}`,
		};
	},
	run: async (ctx, input) => {
		const { storedEntries, bills } = await load(ctx);
		const entry = storedEntries.find((each) => each.id === input.id);
		if (!entry) throw new ToolError("No entry has that id. Find it with find_entries.");
		const undo: UndoWrite[] = [{ collection: ENTRIES, id: entry.id, previous: entry }];
		await save(ctx, ENTRIES, entry.id, entry, true);
		const bill = entry.billId ? bills.find((each) => each.id === entry.billId) : undefined;
		if (bill) {
			const month = entry.billMonth ?? entry.at.slice(0, 7);
			await save(ctx, BILLS, bill.id, unpaidBill(bill, month));
			undo.push({ collection: BILLS, id: bill.id, previous: bill });
		}
		return { result: { deleted: entryBrief(entry) }, changed: [ENTRIES, BILLS], undo };
	},
});

export const financeTools = [
	financeOverview,
	findEntries,
	spendingBreakdown,
	listBills,
	logSpending,
	logIncome,
	payBill,
	addBill,
	setBudgetLine,
	setBalance,
	deleteEntry,
];
