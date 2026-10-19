import type { DreamCategory } from "./wishlist-model";

/** What a typed line like "a GPS sports watch for running, rs 120k" says. */
export type WishLine = {
	name: string;
	price: number | null;
	category: DreamCategory;
	/** Words after "for" or "because": a starting reason. */
	why: string;
};

const KEYWORDS: ReadonlyArray<[DreamCategory, RegExp]> = [
	["bikes", /\b(bike|motorbike|motorcycle|scooter|cycle|bicycle)\b/i],
	["cars", /\b(car|suv|sedan|hatchback|jeep|pickup)\b/i],
	[
		"tech",
		/\b(laptop|phone|iphone|tablet|ipad|watch|camera|headphones|earbuds|pc|monitor|console|macbook)\b/i,
	],
	["trips", /\b(trip|travel|holiday|vacation|tour|week in|flight|umrah|hajj)\b/i],
	["gear", /\b(gloves|kit|gear|shoes|bag|tent|racket|lessons?|gym|helmet|jacket)\b/i],
];

export function guessCategory(text: string): DreamCategory {
	for (const [category, pattern] of KEYWORDS) if (pattern.test(text)) return category;
	return "other";
}

/** "120k", "3.8m", "12 lakh", "1.5 crore", "rs 650,000", "1,20,000" → rupees; null if none. */
export function parsePrice(text: string): number | null {
	const pattern =
		/(rs\.?|pkr)?\s*(\d[\d,]*(?:\.\d+)?)\s*(k|thousand|m|million|lakh|lac|lacs|lakhs|crore|cr)?\b/gi;
	for (const match of text.replace(/(\d),(?=\d)/g, "$1").matchAll(pattern)) {
		const value = Number(match[2]);
		if (!Number.isFinite(value) || value <= 0) continue;
		const unit = (match[3] ?? "").toLowerCase();
		const scale =
			unit === "k" || unit === "thousand"
				? 1000
				: unit === "m" || unit === "million"
					? 1_000_000
					: unit.startsWith("la")
						? 100_000
						: unit === "crore" || unit === "cr"
							? 10_000_000
							: 1;
		const rupees = Math.round(value * scale);
		// A bare number under 1,000 is more likely a model ("800", "16") than a price.
		if (scale === 1 && !match[1] && rupees < 1000) continue;
		return rupees;
	}
	return null;
}

function capitalise(text: string): string {
	return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Reads a dream from one typed line. The name drops "a/an/the", the price and the reason. */
export function parseWishLine(raw: string): WishLine {
	const line = raw.trim();
	const price = parsePrice(line);
	const reasonMatch = /\b(?:for|because|so (?:i|that))\b(.+)$/i.exec(line);
	let name = line
		.replace(/(?:rs\.?|pkr)\s*[\d,.]+\s*(?:k|m|lakh|lac|crore|cr)?/gi, "")
		.replace(/\b[\d,.]+\s*(?:k|m|million|lakh|lacs?|lakhs|crore|cr)\b/gi, "")
		.replace(/\b(?:i want|i'd love|add|get me|buy)\b/gi, "")
		.replace(/\b(?:for|because|so (?:i|that))\b.+$/i, "")
		.replace(/^\s*(?:a|an|the|some)\s+/i, "")
		.replace(/[,.;:]+\s*$/g, "")
		.replace(/\s{2,}/g, " ")
		.trim();
	if (!name) name = line;
	return {
		name: capitalise(name).slice(0, 80),
		price,
		category: guessCategory(line),
		why: reasonMatch?.[1]?.replace(/[,.;:]+\s*$/g, "").trim() ?? "",
	};
}
