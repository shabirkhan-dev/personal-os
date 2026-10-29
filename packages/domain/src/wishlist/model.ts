import type { ColorTokens } from "@personal-os/tokens";
import { asArray, asBoolean, asNumber, asString, isRecord, oneOf } from "../parse";

/**
 * Wishlist's documents: dreams (things to save for, cash only), what is already owned (the
 * garage) and a few settings. Each is read back through `parse` so an older or damaged row
 * becomes a valid value or is skipped.
 */

export const DREAM_CATEGORIES = ["tech", "bikes", "cars", "gear", "trips", "other"] as const;
export type DreamCategory = (typeof DREAM_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<DreamCategory, string> = {
	tech: "Tech",
	bikes: "Bikes",
	cars: "Cars",
	gear: "Gear",
	trips: "Trips",
	other: "Other",
};

export const CATEGORY_TONES: Record<DreamCategory, keyof ColorTokens> = {
	tech: "accentDefault",
	bikes: "statusCaution",
	cars: "statusSuccess",
	gear: "statusDanger",
	trips: "statusViolet",
	other: "textSecondary",
};

export const CATEGORY_TILES: Record<DreamCategory, keyof ColorTokens> = {
	tech: "accentSubtle",
	bikes: "statusCautionSubtle",
	cars: "statusSuccessSubtle",
	gear: "statusDangerSubtle",
	trips: "statusVioletSubtle",
	other: "bgSubtle",
};

export const STATUSES = ["saving", "want", "got"] as const;
/** "saving" gets money now, "want" waits its turn, "got" is bought (cash). */
export type DreamStatus = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<DreamStatus, string> = {
	saving: "Saving",
	want: "Want",
	got: "Got it",
};

/** The bundled Figma product photos; a dream may use one until the person adds their own. */
export const PHOTO_KEYS = [
	"pro-laptop",
	"light-laptop",
	"flagship-phone",
	"sports-watch",
	"boxing-kit",
	"adventure-bike",
	"street-bike",
	"compact-suv",
	"ski-trip",
	"swim-lessons",
] as const;
export type PhotoKey = (typeof PHOTO_KEYS)[number];

/** A dream's photo: a bundled one, or a file the person took or picked. */
export type Photo = { kind: "bundled"; key: PhotoKey } | { kind: "file"; uri: string } | null;

export type Contribution = {
	id: string;
	amount: number;
	/** ISO time it was moved. */
	at: string;
	/** The Finance entry that took it out of the budget, so Undo can remove both. */
	entryId: string | null;
	/** The Finance budget line it came from ("other" is Buffer). */
	from: string | null;
};

export type CheckItem = { id: string; label: string; done: boolean };

export type Spec = { label: string; value: string };

export type Dream = {
	id: string;
	name: string;
	/** Expected cash price, rupees. */
	price: number;
	/** Put aside so far; always the sum of `contributions`. */
	savedAmount: number;
	contributions: Contribution[];
	category: DreamCategory;
	/** 1 is first in line; the roadmap funds dreams in this order. */
	priority: number;
	status: DreamStatus;
	photo: Photo;
	/** When the person hopes to have it; the ETA from saving may differ. */
	targetDate: string | null;
	/** "Why I want it": required when adding, so the dream is easier to wait for. */
	notes: string;
	/** True for a work tool that earns money back ("Pays for itself"). */
	paysForItself: boolean;
	checklist: CheckItem[];
	/** Rows for Compare: "Screen · 16 inch". */
	specs: Spec[];
	/** Price range the person (or AI) found, rupees. */
	priceLow: number | null;
	priceHigh: number | null;
	addedAt: string;
	/** When it was marked "Got it". */
	gotAt: string | null;
};

export type ServiceItem = {
	id: string;
	label: string;
	/** Every this many km, for vehicles. */
	everyKm: number | null;
	/** Every this many days. */
	everyDays: number | null;
	lastKm: number | null;
	/** ISO date it was last done. */
	lastAt: string | null;
};

export const OWNED_KINDS = ["vehicle", "tech", "other"] as const;
export type OwnedKind = (typeof OWNED_KINDS)[number];

export type Owned = {
	id: string;
	name: string;
	kind: OwnedKind;
	photo: Photo;
	/** Vehicles: odometer now. */
	km: number | null;
	/** ISO date it was bought. */
	boughtAt: string | null;
	/** What the person thinks it would sell for now; null when unknown. */
	resale: number | null;
	note: string;
	service: ServiceItem[];
};

export const SAVE_SHARES = [0.2, 0.3, 0.4] as const;

export type WishlistSettings = {
	id: "settings";
	/** Share of monthly income that goes to dreams (Roadmap's 20 / 30 / 40%). */
	saveShare: number;
	/** Days a new dream waits before it can be bought. */
	coolOffDays: number;
	/** Monthly income for the roadmap when Finance has none (job hunting). */
	plannedIncome: number;
};

export function defaultWishlistSettings(): WishlistSettings {
	return { id: "settings", saveShare: 0.3, coolOffDays: 30, plannedIncome: 0 };
}

// --- parsing ------------------------------------------------------------------------------------

const asIso = (value: unknown) =>
	typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : null;
const money = (value: unknown, fallback: number) =>
	Math.min(1_000_000_000, Math.max(0, Math.round(asNumber(value, fallback) * 100) / 100));
const text = (value: unknown, max: number) => asString(value, "").trim().slice(0, max);
const idOf = (value: unknown) => (typeof value === "string" && value ? value : null);
const count = (value: unknown) => {
	const number = asNumber(value, Number.NaN);
	return Number.isFinite(number) && number >= 0 ? Math.round(number) : null;
};

export function parsePhoto(raw: unknown): Photo {
	if (!isRecord(raw)) return null;
	if (raw.kind === "bundled") {
		const key = oneOf(raw.key, PHOTO_KEYS, "pro-laptop");
		return raw.key === key ? { kind: "bundled", key } : null;
	}
	if (raw.kind === "file") {
		const uri = text(raw.uri, 500);
		return uri ? { kind: "file", uri } : null;
	}
	return null;
}

function parseContribution(raw: unknown): Contribution | null {
	if (!isRecord(raw)) return null;
	const id = idOf(raw.id);
	const at = asIso(raw.at);
	const amount = money(raw.amount, 0);
	if (!id || !at || amount <= 0) return null;
	return { id, amount, at, entryId: idOf(raw.entryId), from: idOf(raw.from) };
}

export function parseDream(raw: unknown): Dream | null {
	if (!isRecord(raw)) return null;
	const id = idOf(raw.id);
	const name = text(raw.name, 80);
	const addedAt = asIso(raw.addedAt);
	if (!id || !name || !addedAt) return null;
	const contributions = asArray(raw.contributions, parseContribution);
	const priceLow = raw.priceLow === null ? null : money(raw.priceLow, 0) || null;
	const priceHigh = raw.priceHigh === null ? null : money(raw.priceHigh, 0) || null;
	return {
		id,
		name,
		price: money(raw.price, 0),
		savedAmount: Math.round(contributions.reduce((sum, item) => sum + item.amount, 0) * 100) / 100,
		contributions,
		category: oneOf(raw.category, DREAM_CATEGORIES, "other"),
		priority: Math.max(1, count(raw.priority) ?? 999),
		status: oneOf(raw.status, STATUSES, "want"),
		photo: parsePhoto(raw.photo),
		targetDate: asIso(raw.targetDate),
		notes: text(raw.notes, 400),
		paysForItself: asBoolean(raw.paysForItself, false),
		checklist: asArray(raw.checklist, (item) => {
			if (!isRecord(item)) return null;
			const itemId = idOf(item.id);
			const label = text(item.label, 80);
			return itemId && label ? { id: itemId, label, done: asBoolean(item.done, false) } : null;
		}).slice(0, 12),
		specs: asArray(raw.specs, (item) => {
			if (!isRecord(item)) return null;
			const label = text(item.label, 30);
			const value = text(item.value, 40);
			return label && value ? { label, value } : null;
		}).slice(0, 10),
		priceLow,
		priceHigh,
		addedAt,
		gotAt: asIso(raw.gotAt),
	};
}

function parseService(raw: unknown): ServiceItem | null {
	if (!isRecord(raw)) return null;
	const id = idOf(raw.id);
	const label = text(raw.label, 60);
	if (!id || !label) return null;
	return {
		id,
		label,
		everyKm: count(raw.everyKm) || null,
		everyDays: count(raw.everyDays) || null,
		lastKm: count(raw.lastKm),
		lastAt: asIso(raw.lastAt),
	};
}

export function parseOwned(raw: unknown): Owned | null {
	if (!isRecord(raw)) return null;
	const id = idOf(raw.id);
	const name = text(raw.name, 80);
	if (!id || !name) return null;
	return {
		id,
		name,
		kind: oneOf(raw.kind, OWNED_KINDS, "other"),
		photo: parsePhoto(raw.photo),
		km: count(raw.km),
		boughtAt: asIso(raw.boughtAt),
		resale: raw.resale === null ? null : money(raw.resale, 0) || null,
		note: text(raw.note, 200),
		service: asArray(raw.service, parseService).slice(0, 12),
	};
}

export function parseWishlistSettings(raw: unknown): WishlistSettings | null {
	if (!isRecord(raw)) return null;
	const base = defaultWishlistSettings();
	const share = asNumber(raw.saveShare, base.saveShare);
	return {
		id: "settings",
		saveShare: Math.min(0.9, Math.max(0.05, share)),
		coolOffDays: Math.min(180, Math.max(0, count(raw.coolOffDays) ?? base.coolOffDays)),
		plannedIncome: money(raw.plannedIncome, 0),
	};
}
