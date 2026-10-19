import { describe, expect, it } from "bun:test";
import { groceryMatches } from "@/modules/food/lib/grocery-match";
import {
	balanceNow,
	balanceTone,
	budgetTotal,
	bufferLine,
	dayGroups,
	dayTitle,
	entryLine,
	financeNotes,
	interestOwed,
	lineRoom,
	monthlyBurn,
	pace,
	project,
	recap,
	runwayDays,
	shortK,
	signed,
	sourceTotals,
	upcomingBills,
} from "./finance-math";
import {
	type Bill,
	defaultLimits,
	defaultSettings,
	type Entry,
	type FinanceSettings,
	parseBill,
	parseEntry,
	parseSettings,
	parseSource,
} from "./finance-model";
import { parseFinanceLine } from "./parse-finance-line";

const now = new Date("2026-10-16T18:20:00");
const settings: FinanceSettings = {
	...defaultSettings(new Date("2026-10-16T08:00:00")),
	setUp: true,
	balance: 148_500,
};

const entry = (at: string, fields: Partial<Entry> = {}): Entry => ({
	id: `${at}-${fields.title ?? "x"}`,
	kind: "spend",
	amount: 1000,
	category: "food",
	title: "Groceries",
	note: "",
	method: "cash",
	sourceId: null,
	clean: true,
	purify: false,
	billId: null,
	at: new Date(at).toISOString(),
	receiptUri: null,
	...fields,
});

const bill = (fields: Partial<Bill>): Bill => ({
	id: fields.name ?? "bill",
	name: "Electricity",
	provider: "",
	amount: 2400,
	dueDay: 18,
	category: "bills",
	paid: [],
	since: null,
	...fields,
});

describe("runway", () => {
	it("counts 81 days from Rs 148,500 at Rs 55,000 a month", () => {
		expect(monthlyBurn(settings)).toBe(55_000);
		expect(runwayDays(148_500, 55_000)).toBe(81);
		expect(runwayDays(148_500, 0)).toBeNull();
		expect(monthlyBurn({ ...settings, monthlyIncome: 60_000 })).toBe(0);
	});

	it("projects month by month and finds the day it runs out", () => {
		const projection = project(148_500, settings, now);
		expect(projection.points.map((point) => point.at.getDate())).toEqual([16, 1, 1, 1]);
		expect(projection.points[1]?.balance).toBeGreaterThan(118_000);
		expect(projection.points[1]?.balance).toBeLessThan(122_000);
		expect(projection.runsOut?.getMonth()).toBe(0);
		expect(projection.runsOut?.getDate()).toBeGreaterThanOrEqual(4);
		expect(projection.runsOut?.getDate()).toBeLessThanOrEqual(6);
		const job = project(148_500, settings, now, { jobFrom: new Date(2026, 11, 1), cut: 0 });
		expect(job.runsOut).toBeNull();
		const cut = project(148_500, settings, now, { jobFrom: null, cut: 10_000 });
		expect(cut.runsOut && projection.runsOut ? cut.runsOut > projection.runsOut : false).toBe(true);
		expect(project(0, settings, now).runsOut?.getDate()).toBe(16);
	});

	it("protects the minimum and colours by months covered", () => {
		const protectedMonth = { ...settings, protect: true };
		expect(monthlyBurn(protectedMonth)).toBe(
			protectedMonth.minimum.reduce((sum, item) => sum + item.amount, 0),
		);
		expect(balanceTone(121_000, 55_000)).toBe("accentDefault");
		expect(balanceTone(66_000, 55_000)).toBe("statusCaution");
		expect(balanceTone(11_000, 55_000)).toBe("statusDanger");
		expect(bufferLine(148_500, settings, now)).toBe(
			"A job by early December keeps a full month of buffer",
		);
		expect(bufferLine(40_000, settings, now)).toContain("Less than a month");
	});

	it("moves the balance with entries after it was set", () => {
		const entries = [
			entry("2026-10-16T07:00:00", { amount: 500 }),
			entry("2026-10-16T12:00:00", { amount: 1680 }),
			entry("2026-10-16T13:00:00", { kind: "income", amount: 45_000, category: "other" }),
		];
		expect(balanceNow(settings, entries)).toBe(148_500 - 1680 + 45_000);
	});
});

describe("budget and bills", () => {
	it("splits a month's cost into limits that add back up", () => {
		const limits = defaultLimits(55_000);
		expect(limits).toMatchObject({ food: 24_000, bills: 7200, transport: 5000, giving: 8000 });
		expect(budgetTotal(limits)).toBe(55_000);
		expect(budgetTotal(defaultLimits(61_234))).toBe(61_234);
	});

	it("knows the pace of the month", () => {
		const month = pace(31_200, 55_000, now);
		expect(month.daysLeft).toBe(16);
		expect(Math.round(month.perDay)).toBe(1488);
		expect(month.state).toBe("on track");
		expect(pace(40_000, 55_000, now).state).toBe("ahead");
		expect(pace(56_000, 55_000, now).state).toBe("over");
	});

	it("lists unpaid bills soonest first, paid ones next month", () => {
		const bills = [
			bill({ name: "Internet", dueDay: 22, amount: 3500 }),
			bill({ name: "Electricity", dueDay: 18 }),
			bill({ name: "Phone", dueDay: 1, amount: 1200, paid: ["2026-10"] }),
			bill({ name: "Rent", dueDay: 5, amount: 20_000 }),
		];
		const due = upcomingBills(bills, now);
		expect(due.map((item) => item.bill.name)).toEqual(["Rent", "Electricity", "Internet", "Phone"]);
		expect(due[0]?.overdue).toBe(true);
		expect(due[3]?.due.getMonth()).toBe(10);
		expect(
			upcomingBills([bill({ dueDay: 31 })], new Date("2026-11-10T10:00:00"))[0]?.due.getDate(),
		).toBe(30);
	});

	it("keeps last month's unpaid bill overdue into the new month", () => {
		const nov = new Date("2026-11-01T09:00:00");
		const added = bill({ dueDay: 28, since: "2026-10" });
		expect(upcomingBills([added], new Date("2026-10-30T09:00:00"))[0]?.overdue).toBe(true);
		const late = upcomingBills([added], nov)[0];
		expect(late?.overdue).toBe(true);
		expect(late?.due.getMonth()).toBe(9);
		expect(late?.due.getDate()).toBe(28);
		const paid = upcomingBills([{ ...added, paid: ["2026-10"] }], nov)[0];
		expect(paid?.overdue).toBe(false);
		expect(paid?.due.getMonth()).toBe(10);
		// Added this month: last month's date came before the bill existed.
		expect(upcomingBills([bill({ dueDay: 28, since: "2026-11" })], nov)[0]?.due.getMonth()).toBe(
			10,
		);
		// Older bills without `since` count from their first paid month.
		expect(upcomingBills([bill({ dueDay: 28, paid: ["2026-09"] })], nov)[0]?.due.getMonth()).toBe(
			9,
		);
	});

	it("knows what each line has free for Wishlist's Add savings", () => {
		const room = lineRoom(
			settings,
			[
				entry("2026-10-10T10:00:00", { category: "other", amount: 3000 }),
				entry("2026-09-30T10:00:00", { category: "other", amount: 9000 }),
				entry("2026-10-12T10:00:00", { category: "transport", amount: 9000 }),
			],
			now,
		);
		expect(room.other).toBe(settings.limits.other - 3000);
		expect(room.transport).toBe(0);
		expect(room.dreams).toBe(0);
		expect(defaultLimits(55_000).dreams).toBe(0);
	});
});

describe("history and halal", () => {
	const entries = [
		entry("2026-10-16T18:20:00", { title: "Groceries", amount: 1680, note: "chicken, milk" }),
		entry("2026-10-16T09:10:00", { title: "Bike fuel", amount: 1500, category: "transport" }),
		entry("2026-10-15T11:00:00", {
			title: "Contract payment",
			kind: "income",
			amount: 45_000,
			category: "other",
			sourceId: "contract",
		}),
		entry("2026-10-15T12:00:00", {
			title: "Interest",
			kind: "income",
			amount: 310,
			category: "other",
			sourceId: "old",
			clean: false,
		}),
	];

	it("groups by day with the day's net", () => {
		const groups = dayGroups(entries);
		expect(groups.map((group) => [group.day, group.net])).toEqual([
			["2026-10-16", -3180],
			["2026-10-15", 45_310],
		]);
		expect(dayTitle("2026-10-16", now)).toBe("Today");
		expect(dayTitle("2026-10-15", now)).toBe("Yesterday");
		expect(dayTitle("2026-10-12", now)).toBe("Mon 12 Oct");
	});

	it("writes rows like the Figma", () => {
		expect(entryLine(entries[0] as Entry, now)).toBe("Food · chicken, milk · 18:20");
		expect(entryLine(entries[2] as Entry, now)).toBe("Income · halal ✓ · yesterday");
		expect(signed(entries[0] as Entry)).toBe("– Rs 1,680");
		expect(signed(entries[2] as Entry)).toBe("+ Rs 45,000");
		expect(shortK(31_200)).toBe("31.2k");
		expect(shortK(55_000)).toBe("55k");
	});

	it("keeps interest apart until it is given away", () => {
		expect(interestOwed(entries)).toBe(310);
		const given = entry("2026-10-16T19:00:00", { amount: 310, category: "giving", purify: true });
		expect(interestOwed([...entries, given])).toBe(0);
		const sources = [
			{ id: "contract", name: "Contract work", note: "", halal: true },
			{ id: "old", name: "Old bank account", note: "", halal: false },
			{ id: "idle", name: "Side project", note: "", halal: true },
		];
		expect(
			sourceTotals(entries, sources, now).map((item) => [item.source.id, item.amount]),
		).toEqual([
			["contract", 45_000],
			["old", 310],
			["idle", 0],
		]);
	});

	it("notices what's worth acting on", () => {
		const month = [entry("2026-10-02T10:00:00", { amount: 20_000 }), ...entries];
		const notes = financeNotes({
			settings,
			entries: month,
			bills: [bill({ name: "Bike service", amount: 6000, dueDay: 28 })],
			now,
		});
		expect(notes.map((note) => note.kind)).toEqual([
			"ahead",
			"big-bill",
			"food",
			"job-search",
			"interest",
		]);
		const summary = recap(month, settings, now, "month");
		expect(summary).toMatchObject({ spent: 23_180, income: 45_310, interest: 310 });
		expect(summary.daysAdded).toBe(24);
	});
});

const groceryItem = (id: string, name: string, bought = false) => ({
	id,
	name,
	amount: "",
	section: "protein" as const,
	price: 0,
	bought,
	atHome: false,
});

describe("ask bar", () => {
	it("splits items, quantities and how it was paid", () => {
		expect(parseFinanceLine("chicken 1 kg 800 and milk 4 litre 880, cash")).toEqual({
			kind: "spend",
			items: [
				{ name: "Chicken · 1 kg", amount: 800, category: "food" },
				{ name: "Milk · 4 L", amount: 880, category: "food" },
			],
			method: "cash",
		});
		expect(parseFinanceLine("rs 1,200 phone package")).toMatchObject({
			items: [{ name: "Phone package", amount: 1200, category: "bills" }],
		});
		expect(parseFinanceLine("chicken and milk 1680")).toMatchObject({
			items: [{ name: "Chicken, milk", amount: 1680 }],
		});
		expect(parseFinanceLine("sunscreen 1.4k by bank")).toMatchObject({
			items: [{ category: "care", amount: 1400 }],
			method: "bank",
		});
	});

	it("reads income, savings, screens and questions", () => {
		expect(parseFinanceLine("got 45000 contract payment")).toEqual({
			kind: "income",
			amount: 45_000,
			title: "Contract payment",
			clean: true,
		});
		expect(parseFinanceLine("received 310 interest")).toMatchObject({ clean: false });
		expect(parseFinanceLine("saved 5k")).toEqual({ kind: "save", amount: 5000 });
		expect(parseFinanceLine("budget")).toEqual({ kind: "open", screen: "budget" });
		expect(parseFinanceLine("runway")).toEqual({ kind: "open", screen: "runway" });
		expect(parseFinanceLine("can I afford a bike service?")).toMatchObject({ kind: "question" });
		expect(parseFinanceLine("spent on groceries")).toMatchObject({ kind: "unclear" });
	});

	it("matches spending against the grocery list", () => {
		const list = [
			groceryItem("a", "Chicken breast"),
			groceryItem("b", "Eggs"),
			groceryItem("c", "Milk", true),
		];
		expect(groceryMatches(list, ["Chicken · 1 kg", "Milk · 4 L", "egg"])).toEqual(["a", "b"]);
	});
});

describe("parsing", () => {
	it("repairs damaged rows", () => {
		expect(parseSettings({ monthlyCost: 40_000, limits: { food: "x" } })).toMatchObject({
			monthlyCost: 40_000,
			setUp: false,
			savingsTarget: 240_000,
		});
		expect(parseEntry({ id: "a", amount: 0, at: "2026-10-16T10:00:00Z" })).toBeNull();
		expect(
			parseEntry({ id: "a", amount: 10, at: "2026-10-16T10:00:00Z", kind: "income", clean: false }),
		).toMatchObject({ kind: "income", category: "other", clean: false });
		expect(parseEntry({ id: "a", amount: 10, at: "nope" })).toBeNull();
		expect(
			parseBill({ id: "b", name: "Gas", amount: 900, dueDay: 40, paid: ["2026-10", "bad"] }),
		).toMatchObject({ dueDay: 31, paid: ["2026-10"] });
		expect(parseSource({ id: "s", name: "" })).toBeNull();
	});
});
