import * as z from "zod";

/** The Fashion AI contract. Requests are strict; model answers are trimmed, not failed. */

export const categories = ["top", "layer", "bottom", "shoes", "watch", "scent", "extra"] as const;

const text = (max: number) =>
	z
		.string()
		.default("")
		.transform((value) => value.trim().slice(0, max));

// --- read-piece ------------------------------------------------------------------------------

export const readPieceSchema = z
	.object({
		url: z
			.url({ protocol: /^https?$/ })
			.max(2048)
			.optional(),
		text: z.string().trim().min(1).max(2000).optional(),
	})
	.strict()
	.refine((input) => Boolean(input.url) !== Boolean(input.text), "Send either url or text");

export const pieceDetails = z.object({
	name: text(60).describe("Short and plain, colour first: 'Olive overshirt'"),
	category: z.enum(categories).catch("extra"),
	colour: text(24).describe("One word: olive, navy, white, grey, black, beige, brown, blue…"),
	size: text(20),
	fit: text(20).describe("slim, regular or relaxed, if stated"),
	fabric: text(40),
	price: z
		.number()
		.nonnegative()
		.nullable()
		.catch(null)
		.describe("In the currency written, as a plain number"),
	care: text(60),
	imageUrl: z.string().nullable().catch(null),
});

// --- ask -------------------------------------------------------------------------------------

const piece = z
	.object({
		name: z.string().trim().min(1).max(60),
		category: z.enum(categories),
		colour: z.string().trim().max(24).default(""),
		lastWornDaysAgo: z.number().int().min(0).max(3650).nullable().default(null),
	})
	.strict();

export const askFashionSchema = z
	.object({
		question: z.string().trim().min(1).max(500),
		today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "The user's local date, YYYY-MM-DD"),
		wardrobe: z.array(piece).max(120).default([]),
		weather: z
			.object({ now: z.number(), high: z.number(), low: z.number(), summary: z.string().max(40) })
			.strict()
			.nullable()
			.default(null),
	})
	.strict();

export const fashionAnswer = z.object({
	answer: text(900),
	/** Names from the wardrobe making up a suggested outfit, if the question asked for one. */
	outfit: z
		.array(z.string().transform((value) => value.trim().slice(0, 60)))
		.default([])
		.transform((items) => items.filter(Boolean).slice(0, 6)),
	followUps: z
		.array(z.string().transform((value) => value.trim().slice(0, 80)))
		.default([])
		.transform((items) => items.filter(Boolean).slice(0, 3)),
});

export type ReadPieceInput = z.infer<typeof readPieceSchema>;
export type PieceDetails = z.infer<typeof pieceDetails>;
export type AskFashionInput = z.infer<typeof askFashionSchema>;
export type FashionAnswer = z.infer<typeof fashionAnswer>;
