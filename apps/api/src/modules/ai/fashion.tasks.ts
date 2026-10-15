import type { Config } from "@/config/env";
import { askJson } from "./ai.ask";
import {
	type AskFashionInput,
	type FashionAnswer,
	fashionAnswer,
	type PieceDetails,
	pieceDetails,
	type ReadPieceInput,
} from "./fashion.schema";
import { fetchPage } from "./web-page";

type Deps = { config: Config; readPage?: typeof fetchPage };

/**
 * The Fashion module's AI tasks: reading a piece from a line or a product link, and answering
 * "what should I wear". With the mock provider both answer from the input alone.
 */

export async function readPiece(deps: Deps, input: ReadPieceInput): Promise<PieceDetails> {
	const page = input.url ? await (deps.readPage ?? fetchPage)(input.url) : null;
	const source = page?.text ?? input.text ?? "";
	if (deps.config.ai.provider === "mock") {
		return { ...guessPiece(source), imageUrl: page?.image ?? null };
	}
	const prompt =
		"Read the clothing item, watch, fragrance or accessory described below. Return its short " +
		"name (colour first, e.g. 'Olive overshirt'), category (top, layer for overshirts/jackets/" +
		"blazers/sweaters, bottom, shoes, watch, scent, extra for belts/sunglasses/bags), main " +
		"colour in one word, size, fit, fabric, price as a number and care. Leave a field empty " +
		"rather than guess.";
	const details = await askJson(
		deps.config,
		"Fashion",
		"read-piece",
		prompt,
		page ? `Product page:\n${source}` : source,
		pieceDetails,
	);
	return { ...details, imageUrl: page?.image ?? null };
}

const GUIDANCE =
	"Answer a question about what to wear, using only pieces from the wardrobe given (by their " +
	"exact names) and the weather. Prefer clean, simple combinations, and pieces not worn " +
	"recently. Keep the answer under 80 words. If the question asks for an outfit, list the " +
	"pieces' names in `outfit`. Offer up to three short follow-up questions.";

export async function askFashion(deps: Deps, input: AskFashionInput): Promise<FashionAnswer> {
	if (deps.config.ai.provider === "mock") {
		const names = input.wardrobe.slice(0, 3).map((piece) => piece.name);
		return {
			answer: `You asked “${input.question}”. With a provider key set, the answer appears here.`,
			outfit: names,
			followUps: ["What about tomorrow?"],
		};
	}
	return askJson(
		deps.config,
		"Fashion",
		"fashion-ask",
		GUIDANCE,
		JSON.stringify(input),
		fashionAnswer,
	);
}

const CATEGORY_WORDS: readonly [PieceDetails["category"], RegExp][] = [
	["layer", /\b(overshirt|jacket|blazer|coat|hoodie|sweater|jumper|cardigan|shacket|bomber)\b/],
	["shoes", /\b(sneakers?|trainers?|boots?|loafers?|shoes?|sandals?)\b/],
	["bottom", /\b(chinos?|jeans|trousers|pants|shorts|joggers)\b/],
	["watch", /\bwatch\b/],
	["scent", /\b(perfume|cologne|edp|edt|attar|oud|fragrance|scent)\b/],
	["extra", /\b(belt|sunglasses|cap|hat|bag|wallet|scarf)\b/],
	["top", /\b(tee|t-shirt|shirt|polo|oxford|kurta|henley|top)\b/],
];

const COLOURS =
	/\b(olive|navy|white|grey|gray|black|beige|brown|blue|khaki|green|red|cream|charcoal|indigo|tan|burgundy|maroon)\b/;

/** The mock's reading of a line like "olive overshirt, cotton twill, size M, 6500". */
export function guessPiece(source: string): Omit<PieceDetails, "imageUrl"> {
	const text = source.toLowerCase();
	const category = CATEGORY_WORDS.find(([, pattern]) => pattern.test(text))?.[0] ?? "extra";
	const colour = (COLOURS.exec(text)?.[1] ?? "").replace("gray", "grey");
	const first = source.split(/[,\n]/)[0]?.trim() ?? "";
	const price = /(?:rs\.?\s*)?(\d[\d,]{2,})(?!\s*(?:ml|g)\b)/i.exec(source)?.[1];
	return {
		name: first ? first.charAt(0).toUpperCase() + first.slice(1, 60) : "New piece",
		category,
		colour,
		size: /\bsize\s+([a-z0-9]{1,4})\b/i.exec(source)?.[1]?.toUpperCase() ?? "",
		fit: /\b(slim|regular|relaxed|oversized)\b/i.exec(source)?.[1]?.toLowerCase() ?? "",
		fabric:
			/\b(cotton twill|cotton|linen|wool|denim|leather|suede|polyester|silk)\b/i.exec(
				source,
			)?.[1] ?? "",
		price: price ? Number(price.replace(/,/g, "")) : null,
		care: "",
	};
}
