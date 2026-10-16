import { describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { buildRoutine, CATALOG, photoFor } from "./catalog";
import {
	bodyTiles,
	careNotes,
	emptyDay,
	finishRoutine,
	leftLabel,
	metricsFor,
	monthDays,
	monthlyCost,
	ratingWord,
	reorderSoon,
	runningLow,
	spfDays,
	stepsOn,
	streak,
	supply,
	toggleStep,
	trend,
	weekDays,
	weekStrip,
} from "./care-math";
import {
	type CareDay,
	type CareSettings,
	type CheckIn,
	defaultSettings,
	parseCheckIn,
	parseDay,
	parseProduct,
	parseSettings,
	parseStep,
} from "./care-model";
import { parseCareLine } from "./parse-care-line";
import { parseUv, uvLine } from "./uv";

const today = "2026-10-16"; // a Friday
const now = new Date(`${today}T09:00:00`);
const built = buildRoutine(
	["dark-spots", "dryness", "dandruff", "hair-density"],
	["normal-combination", "sensitive"],
	"2026-09-20",
);
const settings: CareSettings = {
	...defaultSettings(),
	setUp: true,
	concerns: ["dark-spots", "dryness", "dandruff", "hair-density"],
	skin: ["normal-combination", "sensitive"],
};

const day = (id: string, finished: CareDay["finished"] = ["morning"]): CareDay => ({
	...emptyDay(id),
	finished,
});

describe("buildRoutine", () => {
	it("starts with four face products and adds only what the concerns ask for", () => {
		const morning = stepsOn(built.steps, "morning", "2026-10-15"); // Thursday: a wash day
		expect(morning.map((step) => step.name)).toEqual([
			"Cleanser",
			"Niacinamide serum",
			"Ceramide cream",
			"Sunscreen SPF 50",
			"Anti-dandruff wash",
			"Gentle combing",
		]);
		expect(stepsOn(built.steps, "morning", today).map((step) => step.name)).not.toContain(
			"Anti-dandruff wash",
		);
		expect(built.products.filter((product) => product.area === "face")).toHaveLength(4);
		expect(built.habits.find((habit) => habit.link === "water")).toBeDefined();
		const plain = buildRoutine([], ["oily"], today);
		expect(plain.steps.some((step) => step.area === "hair")).toBe(false);
		expect(plain.products.map((product) => product.name)).toContain("Light moisturiser");
	});

	it("every bundled photo exists", () => {
		for (const entry of CATALOG) {
			expect(existsSync(join(import.meta.dir, "../../../../assets/care", `${entry.id}.jpg`))).toBe(
				true,
			);
		}
		expect(photoFor("CeraVe foaming cleanser")).toBe("catalog:cleanser");
		expect(photoFor("Mystery thing")).toBeNull();
	});
});

describe("ticking and the streak", () => {
	const morning = stepsOn(built.steps, "morning", today);

	it("freezes a routine as finished on the last tick, and reopens it on an untick", () => {
		let record = emptyDay(today);
		for (const step of morning) record = toggleStep(record, step, morning, now);
		expect(record.finished).toEqual(["morning"]);
		const first = morning[0];
		if (!first) throw new Error("no steps");
		record = toggleStep(record, first, morning, now);
		expect(record.finished).toEqual([]);
		expect(finishRoutine(emptyDay(today), morning, now).finished).toEqual(["morning"]);
	});

	it("counts days in a row, from yesterday while today is open", () => {
		const days = [day("2026-10-13"), day("2026-10-14"), day("2026-10-15")];
		expect(streak(days, now)).toBe(3);
		expect(streak([...days, day(today)], now)).toBe(4);
		expect(streak([day("2026-10-13"), day("2026-10-15")], now)).toBe(1);
		expect(streak([], now)).toBe(0);
	});
});

describe("shelf", () => {
	const sunscreen = {
		id: "s",
		name: "Sunscreen",
		area: "face" as const,
		photo: null,
		openedOn: "2026-09-26",
		lastsDays: 30,
		price: 1600,
	};
	const comb = { ...sunscreen, id: "c", name: "Comb", lastsDays: 0, price: 800 };

	it("works out what is left and when to reorder", () => {
		expect(supply(sunscreen, now)).toMatchObject({
			daysLeft: 10,
			label: "10 days",
			tone: "statusCaution",
		});
		expect(supply(comb, now)).toBeNull();
		expect(runningLow([comb, sunscreen], now).map((item) => item.id)).toEqual(["s"]);
		expect(reorderSoon([sunscreen], now).total).toBe(1600);
		expect(monthlyCost([sunscreen, comb])).toBe(1600);
		expect(leftLabel(35)).toBe("5 weeks");
		expect(leftLabel(70)).toBe("2 months");
	});
});

describe("week strip", () => {
	it("marks weekly steps done, missed and planned", () => {
		const wash = built.steps.find((step) => step.short === "Wash");
		if (!wash) throw new Error("no wash step");
		const week = weekDays(now);
		expect(week[0]).toBe("2026-10-12");
		const days: CareDay[] = [
			{ ...emptyDay("2026-10-12"), steps: { [wash.id]: now.toISOString() } },
		];
		const cells = weekStrip(built.steps, days, week, today);
		expect(cells[0]).toMatchObject({ letter: "M", label: "Wash", state: "done" });
		expect(cells[3]).toMatchObject({ label: "Wash", state: "missed" });
		expect(cells[6]).toMatchObject({ letter: "S", state: "planned" });
	});
});

describe("check-ins", () => {
	const checkIns: CheckIn[] = [
		{ id: "2026-09-27", ratings: { dandruff: 5, "dark-spots": 4 }, notes: {}, at: "" },
		{ id: "2026-10-04", ratings: { dandruff: 3 }, notes: {}, at: "" },
		{
			id: "2026-10-11",
			ratings: { dandruff: 2, "face-dryness": 2 },
			notes: { "face-dryness": "Less tight" },
			at: "",
		},
	];

	it("rates, trends and asks about what the person works on", () => {
		expect(ratingWord(2).word).toBe("Good");
		expect(ratingWord(3).word).toBe("Okay");
		expect(ratingWord(5).word).toBe("Watch");
		expect(trend(checkIns, "dandruff").map((point) => point.value)).toEqual([5, 3, 2]);
		expect(metricsFor(settings)).toEqual(["face-dryness", "dark-spots", "dandruff", "hair-fall"]);
		const tiles = bodyTiles(checkIns[2] ?? null, built.steps, [], now);
		expect(tiles[0]).toMatchObject({ label: "Face", text: "Less tight", tone: "textSuccess" });
		expect(tiles[3]?.text).toBe("Trim Sunday");
	});

	it("notices missed sunscreen, the dry season and dandruff going down", () => {
		const range = monthDays(now, now);
		expect(range).toHaveLength(16);
		const days = [day("2026-10-14"), day("2026-10-15")];
		const notes = careNotes({ settings, steps: built.steps, days, checkIns, range, now });
		expect(notes.map((note) => note.kind)).toEqual(["spf", "winter", "dandruff"]);
		expect(spfDays(built.steps, days, range)).toBe(0);
	});
});

describe("parseCareLine", () => {
	const context = {
		steps: built.steps,
		habits: built.habits,
		products: built.products,
		routine: "morning" as const,
	};

	it("logs steps, routines and restocks, and opens screens", () => {
		const spf = parseCareLine("used sunscreen", context);
		expect(spf?.kind).toBe("steps");
		if (spf?.kind === "steps") {
			expect(
				built.steps.filter((step) => spf.stepIds.includes(step.id)).map((step) => step.name),
			).toEqual(["Sunscreen SPF 50"]);
		}
		expect(parseCareLine("did my night routine", context)).toEqual({
			kind: "routine",
			routine: "night",
		});
		const floss = parseCareLine("flossed", context);
		expect(floss?.kind === "steps" && floss.habitIds.length).toBe(1);
		expect(parseCareLine("bought a new sunscreen", context)).toEqual({
			kind: "restock",
			productId: "p-sunscreen",
		});
		expect(parseCareLine("shelf", context)).toEqual({ kind: "open", screen: "shelf" });
		expect(parseCareLine("is niacinamide ok with sensitive skin?", context)?.kind).toBe("question");
	});
});

describe("parsing and UV", () => {
	it("repairs damaged rows", () => {
		expect(parseStep({ id: "a", name: "  " })).toBeNull();
		expect(parseStep({ id: "a", name: "Oil", days: [0, 9, 3], minutes: 500 })).toMatchObject({
			days: [0, 3],
			minutes: 60,
		});
		expect(
			parseProduct({ id: "p", name: "X", openedOn: "2026-10-01", photo: "javascript:x" })?.photo,
		).toBeNull();
		expect(
			parseDay({
				id: "2026-10-16",
				steps: { a: "nope", b: "2026-10-16T08:00:00Z" },
				finished: ["morning", "noon"],
			}),
		).toMatchObject({
			steps: { b: "2026-10-16T08:00:00Z" },
			finished: ["morning"],
		});
		expect(parseCheckIn({ id: "2026-10-11", ratings: { dandruff: 9, pores: 3 } })?.ratings).toEqual(
			{ pores: 3 },
		);
		expect(parseSettings({ concerns: ["tan", "magic"], checkInDay: 12 })).toMatchObject({
			concerns: ["tan"],
			checkInDay: 0,
		});
	});

	it("reads Open-Meteo UV and words the warning", () => {
		const uv = parseUv(
			{ elevation: 1500, daily: { time: [today], uv_index_max: [7.6] } },
			"Gilgit",
			now,
		);
		expect(uv).toMatchObject({ day: today, max: 8, elevation: 1500 });
		expect(uvLine(uv, "13:00")).toBe(
			"UV 8 at Gilgit's altitude. Reapply sunscreen at 13:00 if you're out.",
		);
		expect(uvLine(uv && { ...uv, max: 2 }, "13:00")).toBeNull();
	});
});
