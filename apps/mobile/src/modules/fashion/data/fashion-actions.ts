import { removeItem, saveItem } from "@/lib/db/collection";
import { dayKey, newId } from "@/lib/day";
import { CATALOG, type CatalogItem } from "../lib/catalog";
import type { FashionSettings, Piece, PlanDay, Wear, Wish } from "../lib/fashion-model";
import { fashionSettings, pieces, plans, wears, wishes } from "./collections";

/** Every Fashion write. Each saves to the record store, which refreshes the screens and syncs. */

export type NewPiece = Omit<Piece, "id" | "createdAt"> & { id?: string; createdAt?: string };

export async function savePiece(input: NewPiece, now = new Date()): Promise<Piece> {
	const piece: Piece = {
		...input,
		id: input.id ?? newId(),
		name: input.name.trim(),
		createdAt: input.createdAt ?? now.toISOString(),
	};
	await saveItem(pieces, piece);
	return piece;
}

export function pieceFromCatalog(item: CatalogItem): NewPiece {
	return {
		name: item.name,
		category: item.category,
		colour: item.colour,
		image: `catalog:${item.id}`,
		size: "",
		fit: "",
		fabric: "",
		price: null,
		boughtOn: null,
		care: "",
		note: "",
		level: item.category === "scent" ? 1 : null,
		scentTime: item.scentTime ?? null,
	};
}

/** Quick add from the empty Home: one piece per tapped starter. */
export async function addFromCatalog(ids: readonly string[], now = new Date()): Promise<void> {
	const items = CATALOG.filter((item) => ids.includes(item.id));
	await Promise.all(items.map((item) => savePiece(pieceFromCatalog(item), now)));
}

export function deletePiece(piece: Piece): Promise<void> {
	return removeItem(pieces, piece.id);
}

/** Logs today's (or `day`'s) outfit, replacing what was logged before. */
export async function wearLook(
	look: string,
	pieceIds: readonly string[],
	now = new Date(),
): Promise<Wear> {
	const wear: Wear = {
		id: dayKey(now),
		look,
		pieceIds: [...new Set(pieceIds)],
		at: now.toISOString(),
	};
	await saveItem(wears, wear);
	return wear;
}

export function undoWear(previous: Wear | null, current: Wear): Promise<void> {
	return previous ? saveItem(wears, previous) : removeItem(wears, current.id);
}

export function savePlan(
	weekStart: string,
	days: readonly PlanDay[],
	now = new Date(),
): Promise<void> {
	return saveItem(plans, { id: weekStart, days: [...days], createdAt: now.toISOString() });
}

export async function saveWish(
	input: Omit<Wish, "id" | "createdAt"> & { id?: string; createdAt?: string },
	now = new Date(),
): Promise<void> {
	await saveItem(wishes, {
		...input,
		id: input.id ?? newId(),
		createdAt: input.createdAt ?? now.toISOString(),
	});
}

export function removeWish(wish: Wish): Promise<void> {
	return removeItem(wishes, wish.id);
}

/** Bought it: the wish becomes a piece in the wardrobe. */
export async function buyWish(wish: Wish, now = new Date()): Promise<Piece> {
	const piece = await savePiece(
		{
			name: wish.name,
			category: wish.category,
			colour: wish.colour,
			image: wish.image,
			size: "",
			fit: "",
			fabric: "",
			price: wish.price,
			boughtOn: dayKey(now),
			care: "",
			note: "",
			level: wish.category === "scent" ? 1 : null,
			scentTime: wish.category === "scent" ? "day" : null,
		},
		now,
	);
	await removeItem(wishes, wish.id);
	return piece;
}

export function saveSettings(settings: FashionSettings): Promise<void> {
	return saveItem(fashionSettings, settings);
}
