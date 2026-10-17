import { removeItem, saveItem } from "@/lib/db/collection";
import { newId } from "@/lib/day";
import { inLine, moveInLine, renumber } from "../lib/wishlist-math";
import type {
	CheckItem,
	Contribution,
	Dream,
	DreamCategory,
	Owned,
	OwnedKind,
	Photo,
	ServiceItem,
	Spec,
	WishlistSettings,
} from "../lib/wishlist-model";
import { deleteDreamPhoto } from "../services/dream-photo";
import { wishlistDreams, wishlistOwned, wishlistSettings } from "./collections";

/** Every Wishlist write. Each saves to the record store, which refreshes the screens and syncs. */

export function saveSettings(settings: WishlistSettings): Promise<void> {
	return saveItem(wishlistSettings, settings);
}

export function saveDream(dream: Dream): Promise<void> {
	return saveItem(wishlistDreams, dream);
}

/** What to check before buying, by kind of dream. The 30-day wait is checked by the app. */
const CHECKS: Record<DreamCategory, readonly string[]> = {
	tech: ["Compare two options", "Warranty in Pakistan checked"],
	bikes: ["Licence for it", "Riding gear budgeted", "Test ride two bikes"],
	cars: ["Driving licence", "Insurance and token tax priced", "Test drive two cars"],
	gear: ["Tried it on or in a shop"],
	trips: ["Dates fixed", "Leave approved"],
	other: [],
};

export type NewDream = {
	name: string;
	price: number;
	category: DreamCategory;
	notes: string;
	photo: Photo;
	targetDate?: string | null;
	paysForItself?: boolean;
	priceLow?: number | null;
	priceHigh?: number | null;
	specs?: Spec[];
};

/** A new dream joins the end of the line, waiting out the cool-off. */
export async function addDream(
	input: NewDream,
	dreams: readonly Dream[],
	now = new Date(),
): Promise<Dream> {
	const last = inLine(dreams).at(-1);
	const dream: Dream = {
		id: newId(),
		name: input.name.trim().slice(0, 80),
		price: Math.max(0, Math.round(input.price)),
		savedAmount: 0,
		contributions: [],
		category: input.category,
		priority: (last?.priority ?? 0) + 1,
		status: "want",
		photo: input.photo,
		targetDate: input.targetDate ?? null,
		notes: input.notes.trim().slice(0, 400),
		paysForItself: input.paysForItself ?? false,
		checklist: CHECKS[input.category].map((label) => ({ id: newId(), label, done: false })),
		specs: input.specs ?? [],
		priceLow: input.priceLow ?? null,
		priceHigh: input.priceHigh ?? null,
		addedAt: now.toISOString(),
		gotAt: null,
	};
	await saveDream(dream);
	return dream;
}

/** Removes a dream and closes the gap in the line. Savings are moved back by the caller first. */
export async function deleteDream(dream: Dream, dreams: readonly Dream[]): Promise<void> {
	await removeItem(wishlistDreams, dream.id);
	if (dream.photo?.kind === "file") deleteDreamPhoto(dream.photo.uri);
	const rest = renumber(inLine(dreams.filter((item) => item.id !== dream.id)));
	await Promise.all(
		rest
			.filter((item) => dreams.find((old) => old.id === item.id)?.priority !== item.priority)
			.map((item) => saveDream(item)),
	);
}

/** Puts `id` at place `to` (0-based) and saves every dream whose place changed. */
export async function reorder(dreams: readonly Dream[], id: string, to: number): Promise<void> {
	const moved = moveInLine(dreams, id, to);
	await Promise.all(
		moved
			.filter((item) => dreams.find((old) => old.id === item.id)?.priority !== item.priority)
			.map((item) => saveDream(item)),
	);
}

/** "Start saving": this one gets the money now, so it goes first in line. */
export async function startSaving(dream: Dream, dreams: readonly Dream[]): Promise<void> {
	await saveDream({ ...dream, status: "saving" });
	await reorder(
		dreams.map((item) => (item.id === dream.id ? { ...item, status: "saving" } : item)),
		dream.id,
		0,
	);
}

export function addContribution(dream: Dream, contribution: Contribution): Promise<void> {
	const contributions = [...dream.contributions, contribution];
	return saveDream({
		...dream,
		status: dream.status === "want" ? "saving" : dream.status,
		contributions,
		savedAmount: contributions.reduce((sum, item) => sum + item.amount, 0),
	});
}

export function removeContribution(dream: Dream, id: string): Promise<void> {
	const contributions = dream.contributions.filter((item) => item.id !== id);
	return saveDream({
		...dream,
		contributions,
		savedAmount: contributions.reduce((sum, item) => sum + item.amount, 0),
	});
}

export function toggleCheck(dream: Dream, id: string): Promise<void> {
	return saveDream({
		...dream,
		checklist: dream.checklist.map((item) =>
			item.id === id ? { ...item, done: !item.done } : item,
		),
	});
}

export function saveChecklist(dream: Dream, labels: readonly string[]): Promise<void> {
	const checklist: CheckItem[] = labels
		.map((label) => label.trim())
		.filter(Boolean)
		.slice(0, 12)
		.map(
			(label) =>
				dream.checklist.find((item) => item.label === label) ?? { id: newId(), label, done: false },
		);
	return saveDream({ ...dream, checklist });
}

/** "Got it": bought with cash. Tech and vehicles move into the garage to look after. */
export async function markGot(dream: Dream, dreams: readonly Dream[], now = new Date()) {
	await saveDream({ ...dream, status: "got", gotAt: now.toISOString() });
	await Promise.all(
		renumber(inLine(dreams.filter((item) => item.id !== dream.id))).map((item) => saveDream(item)),
	);
	const kind: OwnedKind =
		dream.category === "bikes" || dream.category === "cars"
			? "vehicle"
			: dream.category === "tech"
				? "tech"
				: "other";
	if (dream.category === "trips") return null;
	const owned = newOwned({ name: dream.name, kind, photo: dream.photo }, now);
	await saveOwned(owned);
	return owned;
}

// --- the garage ---------------------------------------------------------------------------------

const VEHICLE_SERVICE: ReadonlyArray<Omit<ServiceItem, "id" | "lastKm" | "lastAt">> = [
	{ label: "Oil and service", everyKm: 3000, everyDays: null },
	{ label: "Chain clean and lube", everyKm: null, everyDays: 14 },
	{ label: "Tyres", everyKm: 20_000, everyDays: null },
	{ label: "Papers and token tax", everyKm: null, everyDays: 365 },
];

export function newOwned(
	fields: { name: string; kind: OwnedKind; photo: Photo; km?: number | null },
	now = new Date(),
): Owned {
	const km = fields.kind === "vehicle" ? (fields.km ?? 0) : null;
	return {
		id: newId(),
		name: fields.name.trim().slice(0, 80),
		kind: fields.kind,
		photo: fields.photo,
		km,
		boughtAt: now.toISOString(),
		resale: null,
		note: "",
		service:
			fields.kind === "vehicle"
				? VEHICLE_SERVICE.map((item) => ({
						id: newId(),
						label: item.label,
						everyKm: item.everyKm,
						everyDays: item.everyDays,
						lastKm: item.everyKm ? km : null,
						lastAt: item.everyDays ? now.toISOString() : null,
					}))
				: [],
	};
}

export function saveOwned(owned: Owned): Promise<void> {
	return saveItem(wishlistOwned, owned);
}

export async function deleteOwned(owned: Owned): Promise<void> {
	await removeItem(wishlistOwned, owned.id);
	if (owned.photo?.kind === "file") deleteDreamPhoto(owned.photo.uri);
}

/** "Log service": the item is done now, at today's odometer. */
export function logService(owned: Owned, itemId: string, km: number | null, now = new Date()) {
	const odometer = km ?? owned.km;
	return saveOwned({
		...owned,
		km: odometer,
		service: owned.service.map((item) =>
			item.id === itemId ? { ...item, lastKm: odometer, lastAt: now.toISOString() } : item,
		),
	});
}
