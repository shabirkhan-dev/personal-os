import { addDays, dayKey } from "@/lib/day";
import type { Category, Colour, Piece, Wear, Wish } from "./fashion-model";

/** Pure Fashion numbers: wear counts, cost per wear, colour story, idle pieces and insights. */

const DAY_MS = 86_400_000;

/** Clothes that make up an outfit; watches, scents and extras finish it. */
export const CLOTHES: readonly Category[] = ["top", "layer", "bottom", "shoes"];

export function wornCount(id: string, wears: readonly Wear[]): number {
	return wears.filter((wear) => wear.pieceIds.includes(id)).length;
}

/** Days since a piece was last worn up to and including `now`'s day, or null if never. */
export function daysSinceWorn(id: string, wears: readonly Wear[], now: Date): number | null {
	const today = dayKey(now);
	let latest: string | null = null;
	for (const wear of wears) {
		if (wear.id <= today && wear.pieceIds.includes(id) && (!latest || wear.id > latest))
			latest = wear.id;
	}
	if (!latest) return null;
	return Math.round(
		(Date.parse(`${today}T12:00:00Z`) - Date.parse(`${latest}T12:00:00Z`)) / DAY_MS,
	);
}

/** Price divided by wears, rounded; null without a price. */
export function costPerWear(piece: Piece, wears: readonly Wear[]): number | null {
	if (piece.price === null) return null;
	return Math.round(piece.price / Math.max(1, wornCount(piece.id, wears)));
}

/** "Worn 14×", "21 days idle", "New", for the tiles. */
export function wearLine(
	piece: Piece,
	wears: readonly Wear[],
	now: Date,
): { text: string; idle: boolean } {
	const worn = wornCount(piece.id, wears);
	const since = daysSinceWorn(piece.id, wears, now);
	const age = Math.round((now.getTime() - Date.parse(piece.createdAt)) / DAY_MS);
	if (CLOTHES.includes(piece.category) && (since ?? age) >= IDLE_DAYS) {
		return { text: `${since ?? age} days idle`, idle: true };
	}
	return { text: worn > 0 ? `Worn ${worn}×` : "New", idle: false };
}

export const IDLE_DAYS = 21;

/** Clothes not worn for three weeks or more (counting from when they were added). */
export function idlePieces(pieces: readonly Piece[], wears: readonly Wear[], now: Date): Piece[] {
	return pieces
		.filter((piece) => wearLine(piece, wears, now).idle)
		.sort(
			(a, b) => (daysSinceWorn(b.id, wears, now) ?? 999) - (daysSinceWorn(a.id, wears, now) ?? 999),
		);
}

export type ColourShare = { colour: Colour; count: number; share: number };

/** How much of the clothes each colour makes up, biggest first. */
export function colourStory(pieces: readonly Piece[]): ColourShare[] {
	const clothes = pieces.filter((piece) => CLOTHES.includes(piece.category));
	const counts = new Map<Colour, number>();
	for (const piece of clothes) counts.set(piece.colour, (counts.get(piece.colour) ?? 0) + 1);
	return [...counts.entries()]
		.map(([colour, count]) => ({ colour, count, share: count / clothes.length }))
		.sort((a, b) => b.count - a.count);
}

/** "Navy and white carry 55% of your wardrobe." */
export function colourHeadline(story: readonly ColourShare[]): string {
	const [first, second] = story;
	if (!first) return "Add a few pieces to see your colours.";
	if (!second) return `${capital(first.colour)} is your whole wardrobe so far.`;
	const share = Math.round((first.share + second.share) * 100);
	return `${capital(first.colour)} and ${second.colour} carry ${share}% of your wardrobe.`;
}

export function capital(text: string): string {
	return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Pieces worn together with this one, most often first. */
export function pairsWith(piece: Piece, pieces: readonly Piece[], wears: readonly Wear[]): Piece[] {
	const counts = new Map<string, number>();
	for (const wear of wears) {
		if (!wear.pieceIds.includes(piece.id)) continue;
		for (const id of wear.pieceIds) if (id !== piece.id) counts.set(id, (counts.get(id) ?? 0) + 1);
	}
	return pieces
		.filter((other) => counts.has(other.id) && CLOTHES.includes(other.category))
		.sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0));
}

const NEUTRAL: ReadonlySet<Colour> = new Set([
	"navy",
	"white",
	"grey",
	"charcoal",
	"black",
	"beige",
	"khaki",
	"indigo",
	"cream",
	"olive",
	"brown",
]);

/** Owned clothes a piece would be worn with: other categories, in a colour that goes. */
export function goesWith(
	item: Pick<Piece, "category" | "colour">,
	pieces: readonly Piece[],
): Piece[] {
	const partners: Record<Category, Category[]> = {
		top: ["bottom", "layer", "shoes"],
		layer: ["top", "bottom"],
		bottom: ["top", "layer", "shoes"],
		shoes: ["bottom"],
		watch: [],
		scent: [],
		extra: [],
	};
	return pieces.filter(
		(piece) =>
			partners[item.category].includes(piece.category) &&
			(NEUTRAL.has(piece.colour) || NEUTRAL.has(item.colour)) &&
			piece.colour !== item.colour,
	);
}

/** How long a watch has been worn in a row, ending today or yesterday. */
export function wornStreak(id: string, wears: readonly Wear[], now: Date): number {
	const days = new Set(wears.filter((wear) => wear.pieceIds.includes(id)).map((wear) => wear.id));
	let cursor = days.has(dayKey(now)) ? now : addDays(now, -1);
	let count = 0;
	while (days.has(dayKey(cursor)) && count < 365) {
		count += 1;
		cursor = addDays(cursor, -1);
	}
	return count;
}

// --- recap and insights -----------------------------------------------------------------------

export type Recap = { wornPieces: number; outfits: number; spent: number; total: number };

export function recap(
	pieces: readonly Piece[],
	wears: readonly Wear[],
	from: Date,
	days: number,
): Recap {
	const start = dayKey(from);
	const end = dayKey(addDays(from, days - 1));
	const inRange = wears.filter((wear) => wear.id >= start && wear.id <= end);
	const worn = new Set(inRange.flatMap((wear) => wear.pieceIds));
	const clothes = pieces.filter((piece) => CLOTHES.includes(piece.category));
	return {
		wornPieces: clothes.filter((piece) => worn.has(piece.id)).length,
		outfits: inRange.length,
		spent: pieces
			.filter((piece) => piece.boughtOn && piece.boughtOn >= start && piece.boughtOn <= end)
			.reduce((sum, piece) => sum + (piece.price ?? 0), 0),
		total: clothes.length,
	};
}

export type InsightAction = "plan-piece" | "keep-wish" | "scent-low" | "add-pieces";
export type Insight = {
	id: string;
	label: string;
	body: string;
	action: { label: string; kind: InsightAction; target?: string };
};

/** "What I noticed": a few plain observations, worked out on the phone. */
export function insights(
	pieces: readonly Piece[],
	wears: readonly Wear[],
	wishes: readonly Wish[],
	now: Date,
): Insight[] {
	const out: Insight[] = [];
	const idle = idlePieces(pieces, wears, now)[0];
	if (idle) {
		const days = daysSinceWorn(idle.id, wears, now);
		out.push({
			id: `rotation-${idle.id}`,
			label: "Rotation",
			body: `The ${idle.name.toLowerCase()} hasn't been worn ${days === null ? "yet" : `in ${days} days`}. It goes with ${goesWith(idle, pieces).length} pieces you already own.`,
			action: { label: "Plan it this week", kind: "plan-piece", target: idle.id },
		});
	}
	const best = [...wishes]
		.map((wish) => ({ wish, pairs: goesWith(wish, pieces).length }))
		.sort((a, b) => b.pairs - a.pairs)[0];
	if (best && best.pairs > 0) {
		out.push({
			id: `wish-${best.wish.id}`,
			label: "Before you buy",
			body: `${capital(best.wish.name.toLowerCase())} works with ${best.pairs} of your pieces, so it's the best value on your wishlist.`,
			action: { label: "Keep it at the top", kind: "keep-wish", target: best.wish.id },
		});
	}
	const low = pieces.find(
		(piece) => piece.category === "scent" && piece.level !== null && piece.level < 0.25,
	);
	if (low) {
		out.push({
			id: `scent-${low.id}`,
			label: "Scent shelf",
			body: `${low.name} is down to ${Math.round((low.level ?? 0) * 100)}%. Wear another on ordinary days to stretch it.`,
			action: { label: "Update the level", kind: "scent-low", target: low.id },
		});
	}
	if (out.length === 0) {
		out.push({
			id: "start",
			label: "Getting started",
			body:
				pieces.length < 6
					? "Add a few more pieces and I'll start planning outfits and spotting what you never wear."
					: "Wear a few looks and I'll point out what rotates well and what sits idle.",
			action: { label: "Add pieces", kind: "add-pieces" },
		});
	}
	return out;
}
