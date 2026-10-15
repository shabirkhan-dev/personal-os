import { COLOURS, type Category, type Colour, type Piece } from "./fashion-model";

/**
 * Reads Fashion's ask bar and the Add piece line on the phone: "olive overshirt, cotton twill,
 * size M, 6500" fills a piece; "wore the olive overshirt with chinos" logs today; "plan my week"
 * opens the plan. Anything else is a question for the Fashion AI.
 */

const CATEGORY_WORDS: readonly [Category, RegExp][] = [
	[
		"layer",
		/\b(overshirt|jacket|blazer|coat|hoodie|sweater|jumper|cardigan|shacket|bomber|waistcoat)\b/,
	],
	["shoes", /\b(sneakers?|trainers?|boots?|loafers?|shoes?|sandals?|chappals?|peshawari)\b/],
	["bottom", /\b(chinos?|jeans|trousers|pants|shorts|joggers|shalwar)\b/],
	["watch", /\bwatch\b/],
	["scent", /\b(perfume|cologne|edp|edt|attar|oud|fragrance|scent)\b/],
	["extra", /\b(belt|sunglasses|cap|hat|bag|wallet|scarf|tie)\b/],
	["top", /\b(tee|t-shirt|tshirt|shirt|polo|oxford|kurta|henley|top)\b/],
];

const COLOUR_ALIASES: Record<string, Colour> = {
	gray: "grey",
	tan: "khaki",
	maroon: "burgundy",
	denim: "indigo",
};

export type PieceGuess = {
	name: string;
	category: Category | null;
	colour: Colour | null;
	size: string;
	fit: string;
	fabric: string;
	price: number | null;
	care: string;
};

export function guessCategory(text: string): Category | null {
	const lower = text.toLowerCase();
	return CATEGORY_WORDS.find(([, pattern]) => pattern.test(lower))?.[0] ?? null;
}

export function guessColour(text: string): Colour | null {
	for (const word of text.toLowerCase().split(/[^a-z]+/)) {
		const alias = COLOUR_ALIASES[word];
		if (alias) return alias;
		if ((COLOURS as readonly string[]).includes(word) && word !== "other") return word as Colour;
	}
	return null;
}

/** "olive overshirt, cotton twill, size M, 6500" → the fields it states. */
export function guessPiece(text: string): PieceGuess {
	const first = text.split(/[,\n]/)[0]?.trim() ?? "";
	const price = /(?:rs\.?\s*)?\b(\d{1,3}(?:,\d{3})+|\d{3,7})\b(?!\s*(?:ml|g|%))/i.exec(text)?.[1];
	return {
		name: first ? `${first.charAt(0).toUpperCase()}${first.slice(1, 60)}` : "",
		category: guessCategory(text),
		colour: guessColour(text),
		size:
			/\bsize\s+([a-z0-9]{1,4})\b/i.exec(text)?.[1]?.toUpperCase() ??
			/\b(XXL|XL|XS|S|M|L)\b/.exec(text)?.[1] ??
			"",
		fit: /\b(slim|regular|relaxed|oversized)\b/i.exec(text)?.[1]?.toLowerCase() ?? "",
		fabric:
			/\b(cotton twill|cotton|linen|wool|denim|leather|suede|polyester|silk|khaddar)\b/i
				.exec(text)?.[1]
				?.toLowerCase() ?? "",
		price: price ? Number(price.replace(/,/g, "")) : null,
		care: /\b(dry clean|hand wash|cold wash|machine wash)[^,]*/i.exec(text)?.[0]?.trim() ?? "",
	};
}

/** How many fields a guess filled, for "Filled 5 fields from your text". */
export function filledCount(guess: PieceGuess): number {
	return [
		guess.name,
		guess.category,
		guess.colour,
		guess.size,
		guess.fit,
		guess.fabric,
		guess.price,
		guess.care,
	].filter((value) => value !== null && value !== "").length;
}

export type FashionScreen = "plan" | "wishlist" | "wardrobe" | "watches" | "insights";

export type FashionIntent =
	| { kind: "wore"; pieceIds: string[] }
	| { kind: "add"; text: string }
	| { kind: "open"; screen: FashionScreen }
	| { kind: "question"; text: string };

const SCREENS: readonly [RegExp, FashionScreen][] = [
	[/\bplan\b.*\bweek\b|\bweek(ly)? plan\b|\boutfit plan\b/, "plan"],
	[/\bwish ?list\b/, "wishlist"],
	[/\b(wardrobe|closet)\b/, "wardrobe"],
	[/\b(watch box|watches|scents?|perfumes?)\b/, "watches"],
	[/\b(insights?|recap)\b/, "insights"],
];

/** The pieces a line names, by how many of each name's words it contains. */
export function piecesNamed(text: string, pieces: readonly Piece[]): Piece[] {
	const words = new Set(
		text
			.toLowerCase()
			.split(/[^a-z0-9]+/)
			.filter(Boolean),
	);
	const found: Piece[] = [];
	const takenCategories = new Set<Category>();
	const scored = pieces
		.map((piece) => {
			const nameWords = piece.name
				.toLowerCase()
				.split(/[^a-z0-9]+/)
				.filter(Boolean);
			const hits = nameWords.filter(
				(word) => words.has(word) || words.has(word.replace(/s$/, "")),
			).length;
			const kind = nameWords.at(-1) ?? "";
			const at = text.toLowerCase().indexOf(kind.replace(/s$/, ""));
			return { piece, hits, at, kindHit: words.has(kind) || words.has(kind.replace(/s$/, "")) };
		})
		.filter((item) => item.kindHit && item.hits > 0)
		.sort((a, b) => b.hits - a.hits);
	const positions = new Map<string, number>();
	for (const { piece, at } of scored) {
		if (takenCategories.has(piece.category)) continue;
		takenCategories.add(piece.category);
		positions.set(piece.id, at);
		found.push(piece);
	}
	// In the order the line names them.
	return found.sort((a, b) => (positions.get(a.id) ?? 0) - (positions.get(b.id) ?? 0));
}

export function parseFashionLine(input: string, pieces: readonly Piece[]): FashionIntent | null {
	const text = input.trim().toLowerCase();
	if (!text) return null;
	const question = /\?$|^(what|which|how|should|can|is|does|do|tell me)\b/.test(text);
	if (!question) {
		if (/^(add|bought|got|new)\b/.test(text)) {
			return {
				kind: "add",
				text: input.trim().replace(/^(add|bought|got|new)\s+(an?\s+|the\s+)?/i, ""),
			};
		}
		if (/\b(wore|wearing|wear|put on|dressed in)\b/.test(text)) {
			const named = piecesNamed(text, pieces);
			if (named.length > 0) return { kind: "wore", pieceIds: named.map((piece) => piece.id) };
		}
		for (const [pattern, screen] of SCREENS) {
			if (pattern.test(text) && text.split(/\s+/).length <= 5) return { kind: "open", screen };
		}
	}
	return { kind: "question", text: input.trim() };
}
