import type { Colour, Piece, PlanDay, Wear } from "./fashion-model";
import { type DayParts, LAYER_BELOW } from "./weather";

/**
 * The outfit engine, on the phone: picks a top, bottom and shoes (and a layer when it's cool),
 * then a watch and a scent. Pieces worn recently score lower, colours are balanced light against
 * dark, and the day's date varies the order so the same wardrobe doesn't give the same look.
 */

const DAY_MS = 86_400_000;

/** Light, mid or dark, for balancing a top against a bottom. */
const TONE: Record<Colour, number> = {
	white: 1,
	cream: 0.95,
	silver: 0.8,
	beige: 0.8,
	khaki: 0.7,
	grey: 0.55,
	olive: 0.4,
	blue: 0.45,
	green: 0.4,
	red: 0.4,
	brown: 0.3,
	burgundy: 0.25,
	charcoal: 0.2,
	indigo: 0.15,
	navy: 0.15,
	black: 0.05,
	other: 0.5,
};

export type DayContext = {
	/** "YYYY-MM-DD". */
	day: string;
	weather: DayParts | null;
	wet: boolean;
	/** True after sunset: evening scents. */
	evening: boolean;
};

export type Look = {
	name: string;
	/** Clothes, outer layer first: layer, top, bottom, shoes. */
	clothes: Piece[];
	watch: Piece | null;
	scent: Piece | null;
	layer: boolean;
};

export function lookPieceIds(look: Look): string[] {
	return [
		...look.clothes,
		...(look.watch ? [look.watch] : []),
		...(look.scent ? [look.scent] : []),
	].map((piece) => piece.id);
}

/** Days since each piece was last worn before `day` (pieces never worn are absent). */
export function lastWorn(wears: readonly Wear[], day: string): Map<string, number> {
	const out = new Map<string, number>();
	const today = Date.parse(`${day}T12:00:00Z`);
	for (const wear of wears) {
		if (wear.id >= day) continue;
		const days = Math.round((today - Date.parse(`${wear.id}T12:00:00Z`)) / DAY_MS);
		for (const id of wear.pieceIds) {
			const known = out.get(id);
			if (known === undefined || days < known) out.set(id, days);
		}
	}
	return out;
}

/** 0 when worn yesterday, 1 when two weeks or more ago (or never). */
function freshness(id: string, worn: Map<string, number>): number {
	const days = worn.get(id);
	return days === undefined ? 1 : Math.min(days - 1, 13) / 13;
}

/** A small, repeatable number per day and piece, so ties break differently each day. */
function jitter(seed: string): number {
	let hash = 2166136261;
	for (let index = 0; index < seed.length; index += 1) {
		hash ^= seed.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return ((hash >>> 0) % 1000) / 1000;
}

function harmony(top: Piece, bottom: Piece): number {
	if (top.colour === bottom.colour && top.colour !== "white") return -0.6;
	return Math.min(1, Math.abs(TONE[top.colour] - TONE[bottom.colour]) * 1.6);
}

const SMART = /\b(oxford|shirt|polo|blazer|chinos|boots|loafers|trousers)\b/i;
const SPORT = /\b(trainers?|joggers|gym|track)\b/i;
const OPEN_SHOES = /\b(white|suede|sandals?|canvas)\b/i;

export function lookName(clothes: readonly Piece[], layer: boolean): string {
	const layerPiece = layer ? clothes[0] : undefined;
	if (layerPiece) {
		const colour = layerPiece.colour === "other" ? "" : layerPiece.colour;
		return colour ? `${colour[0]?.toUpperCase()}${colour.slice(1)} layers` : "Layered";
	}
	const names = clothes.map((piece) => piece.name).join(" ");
	if (SPORT.test(names)) return "Training · kit";
	const smart = clothes.filter((piece) => SMART.test(piece.name)).length;
	if (smart >= 2) return "Smart casual";
	if (/\b(tee|t-shirt)\b/i.test(names) && /\bjeans\b/i.test(names)) return "Easy day";
	return "Clean and simple";
}

/** The best few looks for one day, each with a different top. */
export function looksFor(
	pieces: readonly Piece[],
	wears: readonly Wear[],
	context: DayContext,
	count = 3,
): Look[] {
	const worn = lastWorn(wears, context.day);
	const of = (category: Piece["category"]) => pieces.filter((piece) => piece.category === category);
	// A top worn yesterday sits out today when there is another to wear.
	const allTops = of("top");
	const rested = allTops.filter((piece) => worn.get(piece.id) !== 1);
	const tops = rested.length > 0 ? rested : allTops;
	const bottoms = of("bottom");
	const shoes = of("shoes");
	const layers = of("layer");
	if (tops.length === 0 || bottoms.length === 0) return [];
	const cool = context.weather
		? Math.min(context.weather.morning, context.weather.evening) < LAYER_BELOW
		: false;
	const score = (piece: Piece) =>
		freshness(piece.id, worn) + jitter(`${context.day}:${piece.id}`) * 0.35;

	const bestShoes = (top: Piece, bottom: Piece): Piece | null => {
		let best: Piece | null = null;
		let bestScore = -Infinity;
		for (const pair of shoes) {
			let value = score(pair) + (TONE[pair.colour] !== TONE[bottom.colour] ? 0.2 : 0);
			if (context.wet && OPEN_SHOES.test(pair.name)) value -= 0.8;
			if (SMART.test(top.name) && SMART.test(pair.name)) value += 0.2;
			if (value > bestScore) {
				best = pair;
				bestScore = value;
			}
		}
		return best;
	};

	const bestLayer = (top: Piece, bottom: Piece): Piece | null => {
		if (!cool || layers.length === 0) return null;
		let best: Piece | null = null;
		let bestScore = -Infinity;
		for (const layer of layers) {
			const value =
				score(layer) + harmony(layer, bottom) * 0.5 + (layer.colour === top.colour ? -0.5 : 0.2);
			if (value > bestScore) {
				best = layer;
				bestScore = value;
			}
		}
		return best;
	};

	type Candidate = {
		score: number;
		top: Piece;
		bottom: Piece;
		shoes: Piece | null;
		layer: Piece | null;
	};
	const candidates: Candidate[] = [];
	for (const top of tops) {
		for (const bottom of bottoms) {
			const pair = bestShoes(top, bottom);
			const layer = bestLayer(top, bottom);
			candidates.push({
				top,
				bottom,
				shoes: pair,
				layer,
				score:
					score(top) * 1.2 +
					score(bottom) * 0.8 +
					harmony(top, bottom) +
					(pair ? score(pair) * 0.3 : -0.5) +
					(layer ? score(layer) * 0.4 : 0),
			});
		}
	}
	candidates.sort((a, b) => b.score - a.score);

	const looks: Look[] = [];
	const usedTops = new Set<string>();
	for (const candidate of candidates) {
		if (looks.length >= count) break;
		if (usedTops.has(candidate.top.id)) continue;
		usedTops.add(candidate.top.id);
		const clothes = [candidate.layer, candidate.top, candidate.bottom, candidate.shoes].filter(
			(piece): piece is Piece => piece !== null,
		);
		looks.push({
			name: lookName(clothes, candidate.layer !== null),
			clothes,
			watch: pickWatch(of("watch"), clothes, worn, context.day),
			scent: pickScent(of("scent"), context),
			layer: candidate.layer !== null,
		});
	}
	return looks;
}

const dress = (piece: Piece) => (/\bdress\b/i.test(piece.name) ? 1 : 0);

function pickWatch(
	watches: readonly Piece[],
	clothes: readonly Piece[],
	worn: Map<string, number>,
	day: string,
): Piece | null {
	if (watches.length === 0) return null;
	const smart = clothes.some((piece) => /\b(oxford|blazer)\b/i.test(piece.name));
	return (
		[...watches].sort((a, b) => {
			if (smart && dress(a) !== dress(b)) return dress(b) - dress(a);
			if (!smart && dress(a) !== dress(b)) return dress(a) - dress(b);
			return (
				freshness(b.id, worn) +
				jitter(`${day}:${b.id}`) * 0.2 -
				(freshness(a.id, worn) + jitter(`${day}:${a.id}`) * 0.2)
			);
		})[0] ?? null
	);
}

/** Day scents by day, evening scents after sunset, winter scents when it's cold. */
export function pickScent(
	scents: readonly Piece[],
	context: Pick<DayContext, "weather" | "evening">,
): Piece | null {
	const usable = scents.filter((piece) => piece.level === null || piece.level > 0.02);
	if (usable.length === 0) return null;
	const cold = context.weather ? context.weather.noon < 10 : false;
	const wanted = context.evening ? "evening" : cold ? "winter" : "day";
	return usable.find((piece) => piece.scentTime === wanted) ?? usable[0] ?? null;
}

/** Sprays for a scent: fewer for strong evening scents and in the heat. */
export function sprays(scent: Piece, weather: DayParts | null): number {
	if (scent.scentTime === "evening") return 1;
	return weather && weather.noon >= 25 ? 1 : 2;
}

const on = (temp: number) => temp < LAYER_BELOW;

/** "Overshirt on", "Overshirt off", "Back on", per part of the day. */
export function layerAdvice(
	weather: DayParts,
	layerName: string | null,
): Record<keyof DayParts, string> {
	const short = layerName ? (layerName.split(/\s+/).at(-1) ?? "Layer") : "Layer";
	const label = short.charAt(0).toUpperCase() + short.slice(1);
	return {
		morning: on(weather.morning) ? `${label} on` : "No layer",
		noon: on(weather.noon) ? `${label} on` : on(weather.morning) ? `${label} off` : "No layer",
		evening: on(weather.evening) ? (on(weather.noon) ? `${label} on` : "Back on") : "No layer",
	};
}

/**
 * A week of looks from Monday, each day's pick counting the days before it as worn, so pieces
 * rotate and nothing is worn two days running.
 */
export function planWeek(
	pieces: readonly Piece[],
	wears: readonly Wear[],
	days: readonly DayContext[],
): PlanDay[] {
	const planned: Wear[] = [];
	const out: PlanDay[] = [];
	for (const context of days) {
		const actual = wears.find((wear) => wear.id === context.day);
		if (actual) {
			out.push({ day: context.day, look: actual.look, pieceIds: actual.pieceIds });
			planned.push(actual);
			continue;
		}
		const look = looksFor(pieces, [...wears, ...planned], context, 1)[0];
		if (!look) continue;
		const pieceIds = lookPieceIds(look);
		out.push({ day: context.day, look: look.name, pieceIds });
		planned.push({
			id: context.day,
			look: look.name,
			pieceIds,
			at: `${context.day}T08:00:00.000Z`,
		});
	}
	return out;
}
