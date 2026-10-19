import * as z from "zod";

/** The Wishlist AI contract. Requests are strict; answers are trimmed and clamped, not failed. */

const text = (max: number) =>
	z
		.string()
		.default("")
		.transform((value) => value.trim().slice(0, max));

const rupees = z
	.number()
	.default(0)
	.transform((value) =>
		Number.isFinite(value) ? Math.min(1_000_000_000, Math.max(0, Math.round(value))) : 0,
	);

export const DREAM_CATEGORIES = ["tech", "bikes", "cars", "gear", "trips", "other"] as const;

export const findDreamSchema = z
	.object({
		/** What the person typed: "a GPS sports watch for running and boxing". */
		text: z.string().trim().min(2).max(300),
		today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "The user's local date, YYYY-MM-DD"),
	})
	.strict();

export const dreamFound = z.object({
	name: text(80),
	category: z.enum(DREAM_CATEGORIES).catch("other"),
	/** Up to three versions to pick from, with a typical cash price in Pakistan. */
	options: z
		.array(z.object({ label: text(40), price: rupees }))
		.default([])
		.transform((items) => items.filter((item) => item.label && item.price > 0).slice(0, 3)),
	priceLow: rupees,
	priceHigh: rupees,
	/** What it is for, in a few words: "Training · running". */
	fits: text(60),
});

export type FindDreamInput = z.infer<typeof findDreamSchema>;
export type DreamFound = z.infer<typeof dreamFound>;
