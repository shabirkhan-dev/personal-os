import { newId } from "@/lib/day";
import type { Area, Concern, Habit, Product, SkinType, Step } from "./care-model";

/**
 * The starter shelf (photos from the Figma "Care · Photo assets" frame) and the routine built
 * from what the person wants to work on. Simple, widely sold basics, four for the face first;
 * prices are rough Rupee costs used for the monthly line, nothing more.
 */

export type CatalogItem = {
	id: string;
	name: string;
	area: Area;
	/** Days one lasts at daily use; 0 for tools. */
	lastsDays: number;
	price: number;
	/** Words that match it on the ask bar and in names typed for the shelf. */
	words: readonly string[];
};

const item = (
	id: string,
	name: string,
	area: Area,
	lastsDays: number,
	price: number,
	words: readonly string[],
): CatalogItem => ({ id, name, area, lastsDays, price, words });

export const CATALOG: readonly CatalogItem[] = [
	item("cleanser", "Cleanser", "face", 60, 1200, ["cleanser", "face wash", "facewash"]),
	item("serum", "Niacinamide serum", "face", 45, 1500, ["niacinamide", "serum", "vitamin c"]),
	item("moisturizer", "Ceramide cream", "face", 60, 1800, [
		"ceramide",
		"cream",
		"moisturizer",
		"moisturiser",
	]),
	item("sunscreen", "Sunscreen SPF 50", "face", 30, 1600, ["sunscreen", "sunblock", "spf"]),
	item("shampoo", "Anti-dandruff shampoo", "hair", 45, 900, [
		"shampoo",
		"anti-dandruff",
		"ketoconazole",
	]),
	item("hair-oil", "Rosemary oil", "hair", 60, 700, ["rosemary", "hair oil", "oil"]),
	item("comb-and-brush", "Comb and brush", "hair", 0, 800, ["comb", "brush"]),
	item("body-lotion", "Body lotion", "body", 30, 1000, ["body lotion", "lotion"]),
	item("nail-kit", "Nail kit", "body", 0, 600, ["nail kit", "nail cutter", "clipper"]),
	item("teeth-and-lips", "Teeth and lips", "body", 30, 500, ["toothpaste", "floss", "lip balm"]),
];

export function catalogItem(id: string): CatalogItem | undefined {
	return CATALOG.find((entry) => entry.id === id);
}

/** The bundled photo closest to a typed product name ("CeraVe foaming cleanser" → cleanser). */
export function photoFor(name: string): string | null {
	const lower = name.toLowerCase();
	const match = CATALOG.find((entry) => entry.words.some((word) => lower.includes(word)));
	return match ? `catalog:${match.id}` : null;
}

export type BuiltRoutine = { steps: Step[]; products: Product[]; habits: Habit[] };

/**
 * Morning, night and weekly steps from the concerns and skin type picked on the empty Home.
 * Every routine gets a cleanser, moisturiser and sunscreen; the rest is added only when it
 * answers something the person asked for.
 */
export function buildRoutine(
	concerns: readonly Concern[],
	skin: readonly SkinType[],
	today: string,
	nailDay = 0,
): BuiltRoutine {
	const has = (concern: Concern) => concerns.includes(concern);
	const dry = has("dryness") || skin.includes("dry") || skin.includes("sensitive");
	const serum = has("dark-spots") || has("pores") || has("tan") || skin.includes("oily");
	const hair = has("dandruff") || has("hair-density") || has("early-greys");
	const oil = has("hair-density") || has("early-greys");
	const lotion = dry || has("tan") || has("dark-spots");

	const products: Product[] = [];
	const product = (id: string, name?: string): string => {
		const entry = catalogItem(id);
		if (!entry) throw new Error(`Unknown catalog item ${id}`);
		const productId = `p-${id}`;
		if (!products.some((existing) => existing.id === productId)) {
			products.push({
				id: productId,
				name: name ?? entry.name,
				area: entry.area,
				photo: `catalog:${id}`,
				openedOn: today,
				lastsDays: entry.lastsDays,
				price: entry.price,
			});
		}
		return productId;
	};

	const steps: Step[] = [];
	const step = (
		input: Omit<Step, "id" | "order" | "days" | "short"> & Partial<Pick<Step, "days" | "short">>,
	) => {
		steps.push({ days: [], short: "", ...input, id: newId(), order: steps.length });
	};

	const moisturizer = dry ? "Ceramide cream" : "Light moisturiser";
	step({
		routine: "morning",
		area: "face",
		name: "Cleanser",
		detail: dry ? "Gentle, low foam · 1 min" : "Gentle wash · 1 min",
		productId: product("cleanser"),
		minutes: 1,
	});
	if (serum)
		step({
			routine: "morning",
			area: "face",
			name: "Niacinamide serum",
			detail: "3 drops · spots and pores",
			productId: product("serum"),
			minutes: 1,
		});
	step({
		routine: "morning",
		area: "face",
		name: moisturizer,
		detail: dry ? "Pea size · dry skin" : "Pea size",
		productId: product("moisturizer", moisturizer),
		minutes: 1,
	});
	step({
		routine: "morning",
		area: "face",
		name: "Sunscreen SPF 50",
		detail: "Face, neck, arms · again 13:00",
		productId: product("sunscreen"),
		minutes: 2,
	});
	if (has("dandruff")) {
		step({
			routine: "morning",
			area: "hair",
			name: "Anti-dandruff wash",
			detail: "Leave on 3 to 5 min before rinsing",
			productId: product("shampoo"),
			minutes: 5,
			days: [1, 4],
			short: "Wash",
		});
	}
	if (hair) {
		step({
			routine: "morning",
			area: "hair",
			name: "Gentle combing",
			detail: "Wide-tooth comb on wet hair, never rub dry",
			productId: product("comb-and-brush"),
			minutes: 1,
		});
	}

	step({
		routine: "night",
		area: "face",
		name: "Cleanser",
		detail: "Wash off sunscreen and dust · 1 min",
		productId: product("cleanser"),
		minutes: 1,
	});
	if (serum)
		step({
			routine: "night",
			area: "face",
			name: "Niacinamide serum",
			detail: "3 drops · wait a minute",
			productId: product("serum"),
			minutes: 1,
		});
	step({
		routine: "night",
		area: "face",
		name: moisturizer,
		detail: dry ? "A little more at night · dry skin" : "A little more at night",
		productId: product("moisturizer", moisturizer),
		minutes: 0,
	});
	if (oil) {
		step({
			routine: "night",
			area: "hair",
			name: "Rosemary scalp oil",
			detail: "Massage 3 min · wash out tomorrow",
			productId: product("hair-oil"),
			minutes: 3,
			days: [0, 3],
			short: "Oil",
		});
	}
	if (lotion)
		step({
			routine: "night",
			area: "body",
			name: "Body lotion",
			detail: "Neck, elbows, arms, shins",
			productId: product("body-lotion"),
			minutes: 1,
		});
	if (has("tan") || has("body-odour")) {
		step({
			routine: "night",
			area: "body",
			name: "Body scrub",
			detail: "Gentle, in the shower · not on the face",
			productId: null,
			minutes: 3,
			days: [3],
			short: "Scrub",
		});
	}
	// Everyone gets a weekly nail day; it is the easiest grooming win.
	step({
		routine: "night",
		area: "body",
		name: "Nail care",
		detail: "Trim, file, push cuticles",
		productId: product("nail-kit"),
		minutes: 10,
		days: [nailDay],
		short: "Nails",
	});

	if (has("teeth")) product("teeth-and-lips");
	const habits: Habit[] = [
		{ id: newId(), name: "Brush morning and night", detail: "2 min each", link: null, order: 0 },
		{ id: newId(), name: "Floss", detail: "Before bed", link: null, order: 1 },
		...(lotion
			? [
					{
						id: newId(),
						name: "Shower lotion on damp skin",
						detail: "Locks in water",
						link: null,
						order: 2,
					},
				]
			: []),
		{
			id: newId(),
			name: "Drink 3 L of water",
			detail: "Shared with Food",
			link: "water" as const,
			order: 3,
		},
	];
	return { steps, products, habits };
}
