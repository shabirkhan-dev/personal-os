/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { parsePrice, parseWishLine } from "./parse-wish-line";
import {
	ageLabel,
	amountLeft,
	categoryCounts,
	compactMoney,
	coolOff,
	etaDays,
	inLine,
	monthlyForDreams,
	monthsFor,
	moveInLine,
	progressPercent,
	recap,
	roadmap,
	serviceState,
	totalToSave,
	whenLabel,
	wishlistNotes,
} from "./wishlist-math";
import {
	type Dream,
	defaultWishlistSettings,
	parseDream,
	parseWishlistSettings,
} from "./wishlist-model";

const now = new Date(2026, 9, 17, 12);

function dream(fields: Partial<Dream> & Pick<Dream, "id" | "name" | "price">): Dream {
	return {
		savedAmount: 0,
		contributions: [],
		category: "tech",
		priority: 1,
		status: "want",
		photo: null,
		targetDate: null,
		notes: "",
		paysForItself: false,
		checklist: [],
		specs: [],
		priceLow: null,
		priceHigh: null,
		addedAt: new Date(2026, 8, 1).toISOString(),
		gotAt: null,
		...fields,
	};
}

const laptop = dream({
	id: "a",
	name: "Pro laptop 16",
	price: 650_000,
	priority: 1,
	paysForItself: true,
});
const watch = dream({ id: "b", name: "GPS sports watch", price: 120_000, priority: 2 });
const bike = dream({
	id: "c",
	name: "Adventure bike 800",
	price: 3_800_000,
	priority: 3,
	category: "bikes",
});

describe("one dream", () => {
	test("progress, amount left and ETA from daily saving", () => {
		const half = { ...watch, savedAmount: 60_000 };
		expect(progressPercent(half)).toBe(50);
		expect(amountLeft(half)).toBe(60_000);
		expect(etaDays(60_000, 2_000)).toBe(30);
		expect(etaDays(60_000, 0)).toBeNull();
		expect(etaDays(0, 0)).toBe(0);
		expect(monthsFor(3_800_000 - 1_100_000, 75_000)).toBe(36);
		expect(progressPercent({ price: 100, savedAmount: 150 })).toBe(100);
		expect(amountLeft({ price: 100, savedAmount: 150 })).toBe(0);
	});

	test("the cool-off counts days on the list", () => {
		const settings = defaultWishlistSettings();
		const fresh = dream({
			id: "x",
			name: "x",
			price: 1,
			addedAt: new Date(2026, 9, 10).toISOString(),
		});
		expect(coolOff(fresh, settings, now)).toEqual({ passed: false, daysLeft: 23, days: 7 });
		expect(coolOff(laptop, settings, now).passed).toBe(true);
	});
});

describe("the list", () => {
	test("orders open dreams by priority and totals what's left", () => {
		const got = dream({ id: "d", name: "Phone", price: 420_000, priority: 0, status: "got" });
		expect(inLine([bike, got, watch, laptop]).map((item) => item.id)).toEqual(["a", "b", "c"]);
		expect(totalToSave([bike, got, watch, laptop])).toBe(4_570_000);
		expect(categoryCounts([bike, got, watch, laptop])).toMatchObject({ tech: 2, bikes: 1 });
	});

	test("moving a dream renumbers the line", () => {
		const moved = moveInLine([laptop, watch, bike], "c", 0);
		expect(moved.map((item) => [item.id, item.priority])).toEqual([
			["c", 1],
			["a", 2],
			["b", 3],
		]);
	});

	test("the roadmap funds one dream after another", () => {
		const monthly = monthlyForDreams(350_000, 0.3);
		expect(monthly).toBe(105_000);
		const stops = roadmap([bike, watch, laptop], monthly, now);
		expect(stops.map((stop) => stop.dream.id)).toEqual(["a", "b", "c"]);
		expect(stops[0]?.days).toBe(189);
		expect(stops[1]?.days).toBe(224);
		expect(stops[1]?.after?.id).toBe("a");
		expect(roadmap([laptop], 0, now)[0]?.ready).toBeNull();
	});

	test("labels when, and money in short", () => {
		expect(whenLabel(new Date(2027, 1, 10), now)).toBe("2027 · Q1");
		expect(whenLabel(new Date(2029, 10, 1), now)).toBe("Late 2029");
		expect(whenLabel(new Date(2031, 5, 1), now)).toBe("2031");
		expect(compactMoney(120_000)).toBe("Rs 120k");
		expect(compactMoney(3_800_000)).toBe("Rs 3.8M");
		expect(compactMoney(12_700_000)).toBe("Rs 12.7M");
		expect(compactMoney(950)).toBe("Rs 950");
	});
});

describe("the garage", () => {
	test("service by km and by date", () => {
		const oil = {
			id: "o",
			label: "Oil",
			everyKm: 3000,
			everyDays: null,
			lastKm: 10_000,
			lastAt: null,
		};
		expect(serviceState(oil, { km: 12_400 }, now)).toMatchObject({
			label: "600 km left",
			tone: "statusCaution",
			due: false,
		});
		expect(serviceState(oil, { km: 13_100 }, now).label).toBe("due now");
		const chain = {
			id: "c",
			label: "Chain",
			everyKm: null,
			everyDays: 14,
			lastKm: null,
			lastAt: new Date(2026, 9, 5).toISOString(),
		};
		expect(serviceState(chain, { km: null }, now).label).toBe("due Monday");
		expect(ageLabel(new Date(2022, 9, 1).toISOString(), now)).toBe("4 years");
		expect(ageLabel(null, now)).toBeNull();
	});
});

describe("insights", () => {
	test("recap counts adds, buys and savings in the range", () => {
		const added = dream({
			id: "n",
			name: "New",
			price: 10_000,
			addedAt: new Date(2026, 9, 2, 1).toISOString(),
			contributions: [
				{ id: "k", amount: 5000, at: new Date(2026, 9, 3).toISOString(), entryId: null },
			],
			savedAmount: 5000,
		});
		const bought = dream({
			id: "g",
			name: "Gloves",
			price: 45_000,
			status: "got",
			gotAt: new Date(2026, 9, 9).toISOString(),
		});
		const result = recap([added, bought, laptop], defaultWishlistSettings(), "month", now);
		expect(result).toMatchObject({ added: 1, bought: 1, spent: 45_000, saved: 5000, interest: 0 });
		const notes = wishlistNotes([added, laptop], defaultWishlistSettings(), "month", now);
		expect(notes.map((note) => note.kind)).toEqual(["pays-first", "late-night"]);
	});
});

describe("parsing", () => {
	test("reads typed prices in rupees, k, lakh and crore", () => {
		expect(parsePrice("rs 120k")).toBe(120_000);
		expect(parsePrice("Rs 650,000")).toBe(650_000);
		expect(parsePrice("12 lakh")).toBe(1_200_000);
		expect(parsePrice("1.5 crore")).toBe(15_000_000);
		expect(parsePrice("3.8m")).toBe(3_800_000);
		expect(parsePrice("Adventure bike 800 for 38 lakh")).toBe(3_800_000);
		expect(parsePrice("Pro laptop 16")).toBeNull();
	});

	test("turns a line into a dream", () => {
		expect(parseWishLine("a GPS sports watch for running and boxing, rs 120k")).toEqual({
			name: "GPS sports watch",
			price: 120_000,
			category: "tech",
			why: "running and boxing, rs 120k",
		});
		expect(parseWishLine("adventure bike 800").category).toBe("bikes");
		expect(parseWishLine("Naltar ski trip 150k")).toMatchObject({
			name: "Naltar ski trip",
			price: 150_000,
			category: "trips",
		});
	});

	test("stored rows are cleaned on the way in", () => {
		expect(parseDream({ id: "x" })).toBeNull();
		const parsed = parseDream({
			id: "x",
			name: "  Watch ",
			price: "nope",
			addedAt: "2026-10-01T00:00:00.000Z",
			contributions: [
				{ id: "1", amount: 100, at: "2026-10-02T00:00:00.000Z" },
				{ id: "2", amount: -5, at: "2026-10-02T00:00:00.000Z" },
			],
			status: "bought",
			photo: { kind: "bundled", key: "nope" },
		});
		expect(parsed).toMatchObject({
			name: "Watch",
			price: 0,
			savedAmount: 100,
			status: "want",
			photo: null,
		});
		expect(parseWishlistSettings({ saveShare: 5, coolOffDays: -1 })).toMatchObject({
			saveShare: 0.9,
			coolOffDays: 30,
		});
		expect(parseWishlistSettings({ coolOffDays: 60 })?.coolOffDays).toBe(60);
	});
});
