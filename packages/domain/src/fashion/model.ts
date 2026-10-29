import type { SwatchName } from "@personal-os/tokens";
import type { Place } from "../place";
import { asArray, asBoolean, asNumber, asString, isRecord, oneOf } from "../parse";

/**
 * Fashion's documents: the pieces in the wardrobe, what was worn each day, the week's plan, the
 * wishlist and a few settings. Each lives in its own record-store collection and is read back
 * through a `parse` function, so an older or damaged row becomes a valid value, not a crash.
 */

export const CATEGORIES = ["top", "layer", "bottom", "shoes", "watch", "scent", "extra"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
	top: "Tops",
	layer: "Layers",
	bottom: "Bottoms",
	shoes: "Shoes",
	watch: "Watches",
	scent: "Scents",
	extra: "Extras",
};

export const CATEGORY_ONE: Record<Category, string> = {
	top: "Top",
	layer: "Layer",
	bottom: "Bottom",
	shoes: "Shoes",
	watch: "Watch",
	scent: "Scent",
	extra: "Extra",
};

/** Colours a piece can be; each has a swatch token. */
export const COLOURS = [
	"navy",
	"white",
	"grey",
	"charcoal",
	"black",
	"olive",
	"beige",
	"khaki",
	"brown",
	"blue",
	"indigo",
	"green",
	"cream",
	"burgundy",
	"red",
	"silver",
	"other",
] as const satisfies readonly SwatchName[];
export type Colour = (typeof COLOURS)[number];

/** When a scent fits best. */
export const SCENT_TIMES = ["day", "evening", "winter"] as const;
export type ScentTime = (typeof SCENT_TIMES)[number];

export type Piece = {
	id: string;
	name: string;
	category: Category;
	colour: Colour;
	/** "catalog:white-tee" for a starter photo, else a file:// or https:// image, or null. */
	image: string | null;
	size: string;
	fit: string;
	fabric: string;
	price: number | null;
	/** "YYYY-MM-DD". */
	boughtOn: string | null;
	care: string;
	/** A heads-up shown on the piece: "Shoulders may get snug as you bulk". */
	note: string;
	/** Scents: how full the bottle is, 0–1, and when it suits. */
	level: number | null;
	scentTime: ScentTime | null;
	createdAt: string;
};

/** What was worn on one day; the id is the day, so wearing again replaces it. */
export type Wear = { id: string; look: string; pieceIds: string[]; at: string };

export type PlanDay = { day: string; look: string; pieceIds: string[] };

/** The week's outfits; the id is that week's Monday. */
export type WeekPlan = { id: string; days: PlanDay[]; createdAt: string };

export const WISH_TAGS = ["first", "replace", "someday"] as const;
export type WishTag = (typeof WISH_TAGS)[number];

export const WISH_TAG_LABELS: Record<WishTag, string> = {
	first: "1st pick",
	replace: "Replace",
	someday: "Someday",
};

export type Wish = {
	id: string;
	name: string;
	category: Category;
	colour: Colour;
	price: number | null;
	tag: WishTag;
	/** Why it is wanted: "Interviews and events". */
	reason: string;
	/** When it can be bought: "Unlocks with first salary". */
	unlock: string;
	image: string | null;
	url: string;
	createdAt: string;
};

export type FashionSettings = {
	id: "settings";
	/** For the weather; Faith's place is used when this is empty. */
	place: Place | null;
	buyingPaused: boolean;
	pauseNote: string;
};

export function defaultSettings(): FashionSettings {
	return {
		id: "settings",
		place: null,
		buyingPaused: false,
		pauseNote: "Runway comes first. Items wait here with their reason.",
	};
}

// --- parsing ------------------------------------------------------------------------------------

const DAY = /^\d{4}-\d{2}-\d{2}$/;

function asDay(value: unknown): string | null {
	return typeof value === "string" && DAY.test(value) ? value : null;
}

function asIso(value: unknown, fallback: string): string {
	return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : fallback;
}

function asPrice(value: unknown): number | null {
	return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function asImage(value: unknown): string | null {
	return typeof value === "string" &&
		/^(catalog:[a-z-]+|file:\/\/|https:\/\/|content:\/\/)/.test(value)
		? value
		: null;
}

const asId = (value: unknown) => (typeof value === "string" && value ? value : null);

export function parsePiece(raw: unknown): Piece | null {
	if (!isRecord(raw)) return null;
	const id = asString(raw.id, "");
	const name = asString(raw.name, "").trim();
	if (!id || !name) return null;
	const category = oneOf(raw.category, CATEGORIES, "extra");
	const level = asNumber(raw.level, Number.NaN);
	return {
		id,
		name,
		category,
		colour: oneOf(raw.colour, COLOURS, "other"),
		image: asImage(raw.image),
		size: asString(raw.size, ""),
		fit: asString(raw.fit, ""),
		fabric: asString(raw.fabric, ""),
		price: asPrice(raw.price),
		boughtOn: asDay(raw.boughtOn),
		care: asString(raw.care, ""),
		note: asString(raw.note, ""),
		level: category === "scent" && !Number.isNaN(level) ? Math.min(1, Math.max(0, level)) : null,
		scentTime: category === "scent" ? oneOf(raw.scentTime, SCENT_TIMES, "day") : null,
		createdAt: asIso(raw.createdAt, new Date(0).toISOString()),
	};
}

export function parseWear(raw: unknown): Wear | null {
	if (!isRecord(raw)) return null;
	const id = asDay(raw.id);
	if (!id) return null;
	const pieceIds = asArray(raw.pieceIds, asId);
	if (pieceIds.length === 0) return null;
	return { id, look: asString(raw.look, ""), pieceIds, at: asIso(raw.at, `${id}T12:00:00.000Z`) };
}

function parsePlanDay(raw: unknown): PlanDay | null {
	if (!isRecord(raw)) return null;
	const day = asDay(raw.day);
	if (!day) return null;
	return { day, look: asString(raw.look, ""), pieceIds: asArray(raw.pieceIds, asId) };
}

export function parsePlan(raw: unknown): WeekPlan | null {
	if (!isRecord(raw)) return null;
	const id = asDay(raw.id);
	if (!id) return null;
	return {
		id,
		days: asArray(raw.days, parsePlanDay),
		createdAt: asIso(raw.createdAt, new Date(0).toISOString()),
	};
}

export function parseWish(raw: unknown): Wish | null {
	if (!isRecord(raw)) return null;
	const id = asString(raw.id, "");
	const name = asString(raw.name, "").trim();
	if (!id || !name) return null;
	return {
		id,
		name,
		category: oneOf(raw.category, CATEGORIES, "extra"),
		colour: oneOf(raw.colour, COLOURS, "other"),
		price: asPrice(raw.price),
		tag: oneOf(raw.tag, WISH_TAGS, "someday"),
		reason: asString(raw.reason, ""),
		unlock: asString(raw.unlock, ""),
		image: asImage(raw.image),
		url: asString(raw.url, ""),
		createdAt: asIso(raw.createdAt, new Date(0).toISOString()),
	};
}

function parsePlace(raw: unknown): Place | null {
	if (!isRecord(raw)) return null;
	const latitude = asNumber(raw.latitude, Number.NaN);
	const longitude = asNumber(raw.longitude, Number.NaN);
	if (Number.isNaN(latitude + longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
		return null;
	}
	return { latitude, longitude, name: asString(raw.name, "") };
}

export function parseSettings(raw: unknown): FashionSettings | null {
	if (!isRecord(raw)) return null;
	const base = defaultSettings();
	return {
		id: "settings",
		place: parsePlace(raw.place),
		buyingPaused: asBoolean(raw.buyingPaused, base.buyingPaused),
		pauseNote: asString(raw.pauseNote, base.pauseNote),
	};
}
