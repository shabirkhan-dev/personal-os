import { describe, expect, it } from "bun:test";
import { CATALOG, lookAlike } from "./catalog";
import {
	colourHeadline,
	colourStory,
	costPerWear,
	daysSinceWorn,
	goesWith,
	idlePieces,
	insights,
	pairsWith,
	recap,
	wearLine,
	wornStreak,
} from "./fashion-math";
import { type Piece, parsePiece, parseWear, type Wear } from "./fashion-model";
import {
	layerAdvice,
	lastWorn,
	lookName,
	looksFor,
	pickScent,
	planWeek,
	type DayContext,
} from "./outfits";
import { filledCount, guessPiece, parseFashionLine, piecesNamed } from "./parse-fashion-line";
import { condition, dayParts, feel, parseOpenMeteo } from "./weather";

const now = new Date(2026, 9, 16, 9);

function piece(
	id: string,
	name: string,
	category: Piece["category"],
	colour: Piece["colour"],
	extra: Partial<Piece> = {},
): Piece {
	return {
		id,
		name,
		category,
		colour,
		image: null,
		size: "",
		fit: "",
		fabric: "",
		price: null,
		boughtOn: null,
		care: "",
		note: "",
		level: null,
		scentTime: null,
		createdAt: "2026-09-01T00:00:00.000Z",
		...extra,
	};
}

const wardrobe: Piece[] = [
	piece("tee", "White tee", "top", "white"),
	piece("polo", "Navy polo", "top", "navy"),
	piece("oxford", "White oxford", "top", "white"),
	piece("chinos", "Charcoal chinos", "bottom", "charcoal"),
	piece("jeans", "Jeans", "bottom", "indigo"),
	piece("khaki", "Khaki chinos", "bottom", "khaki"),
	piece("sneakers", "White sneakers", "shoes", "white"),
	piece("boots", "Chelsea boots", "shoes", "brown"),
	piece("overshirt", "Olive overshirt", "layer", "olive", { price: 6500 }),
	piece("field", "Field watch", "watch", "silver"),
	piece("dress", "Dress watch", "watch", "brown"),
	piece("fresh", "Blue fresh", "scent", "blue", { scentTime: "day", level: 0.6 }),
	piece("oud", "Amber oud", "scent", "brown", { scentTime: "evening", level: 0.2 }),
];

const cool: DayContext = {
	day: "2026-10-16",
	weather: { morning: 12, noon: 18, evening: 10 },
	wet: false,
	evening: false,
};

describe("outfit engine", () => {
	it("adds a layer when it is cool and gives each look a different top", () => {
		const looks = looksFor(wardrobe, [], cool, 3);
		expect(looks).toHaveLength(3);
		expect(
			new Set(looks.map((look) => look.clothes.find((p) => p.category === "top")?.id)).size,
		).toBe(3);
		expect(looks[0]?.layer).toBe(true);
		expect(looks[0]?.clothes[0]?.category).toBe("layer");
		expect(looks[0]?.name).toBe("Olive layers");
		expect(looks[0]?.scent?.id).toBe("fresh");
	});

	it("skips the layer on a warm day and avoids yesterday's top", () => {
		const warm = { ...cool, weather: { morning: 22, noon: 28, evening: 21 } };
		const wears: Wear[] = [{ id: "2026-10-15", look: "", pieceIds: ["tee", "jeans"], at: "" }];
		const [first] = looksFor(wardrobe, wears, warm, 1);
		expect(first?.layer).toBe(false);
		expect(first?.clothes.some((p) => p.id === "tee")).toBe(false);
	});

	it("keeps white sneakers out of the rain", () => {
		const [first] = looksFor(wardrobe, [], { ...cool, wet: true }, 1);
		expect(first?.clothes.find((p) => p.category === "shoes")?.id).toBe("boots");
	});

	it("plans a week without repeating a top on consecutive days", () => {
		const days = Array.from({ length: 7 }, (_, step) => ({ ...cool, day: `2026-10-${12 + step}` }));
		const plan = planWeek(wardrobe, [], days);
		expect(plan).toHaveLength(7);
		for (let index = 1; index < plan.length; index += 1) {
			const top = (day: number) =>
				plan[day]?.pieceIds.find((id) => ["tee", "polo", "oxford"].includes(id));
			expect(top(index)).not.toBe(top(index - 1));
		}
	});

	it("names looks, reads layer advice and picks evening scents", () => {
		expect(lookName([wardrobe[1] as Piece, wardrobe[5] as Piece], false)).toBe("Smart casual");
		expect(lookName([wardrobe[0] as Piece, wardrobe[4] as Piece], false)).toBe("Easy day");
		expect(layerAdvice({ morning: 12, noon: 18, evening: 10 }, "Olive overshirt")).toEqual({
			morning: "Overshirt on",
			noon: "Overshirt off",
			evening: "Back on",
		});
		expect(
			pickScent(
				wardrobe.filter((p) => p.category === "scent"),
				{ weather: null, evening: true },
			)?.id,
		).toBe("oud");
		expect(
			lastWorn([{ id: "2026-10-10", look: "", pieceIds: ["tee"], at: "" }], "2026-10-16").get(
				"tee",
			),
		).toBe(6);
	});
});

describe("wardrobe numbers", () => {
	const wears: Wear[] = [
		{ id: "2026-10-14", look: "", pieceIds: ["overshirt", "tee", "chinos", "field"], at: "" },
		{ id: "2026-10-15", look: "", pieceIds: ["overshirt", "polo", "chinos", "field"], at: "" },
	];

	it("counts wears, cost per wear and days since", () => {
		expect(costPerWear(wardrobe[8] as Piece, wears)).toBe(3250);
		expect(daysSinceWorn("overshirt", wears, now)).toBe(1);
		expect(daysSinceWorn("boots", wears, now)).toBeNull();
		expect(wearLine(wardrobe[8] as Piece, wears, now)).toEqual({ text: "Worn 2×", idle: false });
		expect(wearLine(wardrobe[7] as Piece, wears, now)).toEqual({
			text: "45 days idle",
			idle: true,
		});
		expect(idlePieces(wardrobe, wears, now).map((p) => p.id)).toContain("boots");
		expect(wornStreak("field", wears, now)).toBe(2);
	});

	it("tells the colour story and what pairs", () => {
		const story = colourStory(wardrobe);
		expect(story[0]).toMatchObject({ colour: "white", count: 3 });
		expect(colourHeadline(story)).toMatch(/^White and \w+ carry \d+% of your wardrobe\.$/);
		expect(pairsWith(wardrobe[8] as Piece, wardrobe, wears)[0]?.id).toBe("chinos");
		expect(goesWith({ category: "layer", colour: "navy" }, wardrobe).length).toBeGreaterThan(3);
		expect(recap(wardrobe, wears, new Date(2026, 9, 12), 7)).toMatchObject({
			wornPieces: 4,
			outfits: 2,
			total: 9,
		});
	});

	it("notices idle pieces and low scents", () => {
		const found = insights(wardrobe, wears, [], now);
		expect(found.map((item) => item.label)).toEqual(["Rotation", "Scent shelf"]);
	});
});

describe("parsing", () => {
	it("fills a piece from a typed line", () => {
		const guess = guessPiece("olive overshirt, cotton twill, size M, 6500");
		expect(guess).toMatchObject({
			name: "Olive overshirt",
			category: "layer",
			colour: "olive",
			size: "M",
			fabric: "cotton twill",
			price: 6500,
		});
		expect(filledCount(guess)).toBe(6);
		expect(guessPiece("navy chinos rs 3,200").price).toBe(3200);
	});

	it("reads ask-bar lines", () => {
		expect(parseFashionLine("wore the olive overshirt with charcoal chinos", wardrobe)).toEqual({
			kind: "wore",
			pieceIds: ["overshirt", "chinos"],
		});
		expect(parseFashionLine("add navy blazer 18000", wardrobe)).toEqual({
			kind: "add",
			text: "navy blazer 18000",
		});
		expect(parseFashionLine("plan my week", wardrobe)).toEqual({ kind: "open", screen: "plan" });
		expect(parseFashionLine("What should I wear tonight?", wardrobe)?.kind).toBe("question");
		expect(piecesNamed("white sneakers and jeans", wardrobe).map((p) => p.id)).toEqual([
			"sneakers",
			"jeans",
		]);
	});

	it("parses stored pieces and wears tolerantly", () => {
		expect(
			parsePiece({ id: "a", name: "Tee", category: "nope", colour: "pink", image: "javascript:x" }),
		).toMatchObject({ category: "extra", colour: "other", image: null });
		expect(parsePiece({ id: "a", name: "Oud", category: "scent", level: 3 })?.level).toBe(1);
		expect(parseWear({ id: "2026-10-16", pieceIds: [] })).toBeNull();
	});
});

describe("weather and catalog", () => {
	it("reads Open-Meteo and describes the day", () => {
		const forecast = parseOpenMeteo(
			{
				current: { temperature_2m: 18.2, weather_code: 0 },
				hourly: {
					time: ["2026-10-16T08:00", "2026-10-16T13:00", "2026-10-16T19:00"],
					temperature_2m: [12, 18, 10],
				},
				daily: {
					time: ["2026-10-16"],
					temperature_2m_max: [19],
					temperature_2m_min: [9],
					weather_code: [1],
				},
			},
			"Gilgit",
			now,
		);
		expect(forecast?.now.temp).toBe(18.2);
		expect(dayParts(forecast!, "2026-10-16")).toEqual({ morning: 12, noon: 18, evening: 10 });
		expect(feel(18)).toBe("cool");
		expect(condition(61)).toBe("rainy");
		expect(parseOpenMeteo({}, "x", now)).toBeNull();
	});

	it("finds a look-alike photo for every category", () => {
		for (const category of [
			"top",
			"layer",
			"bottom",
			"shoes",
			"watch",
			"scent",
			"extra",
		] as const) {
			expect(lookAlike(category, "navy")?.category).toBe(category);
		}
		expect(new Set(CATALOG.map((item) => item.id)).size).toBe(CATALOG.length);
	});
});
