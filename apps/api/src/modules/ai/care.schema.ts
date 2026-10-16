import * as z from "zod";

/** The Care AI contract (skin, hair, body). Requests are strict; answers are trimmed, not failed. */

const text = (max: number) =>
	z
		.string()
		.default("")
		.transform((value) => value.trim().slice(0, max));

export const askCareSchema = z
	.object({
		question: z.string().trim().min(1).max(500),
		today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "The user's local date, YYYY-MM-DD"),
		concerns: z.array(z.string().trim().min(1).max(30)).max(12).default([]),
		skin: z.array(z.string().trim().min(1).max(30)).max(4).default([]),
		routine: z
			.array(
				z
					.object({
						routine: z.enum(["morning", "night"]),
						name: z.string().trim().min(1).max(60),
					})
					.strict(),
			)
			.max(30)
			.default([]),
		/** The latest weekly check-in: metric → 1 (fine) to 5 (bad). */
		ratings: z.record(z.string().max(30), z.number().int().min(1).max(5)).default({}),
		uv: z.number().min(0).max(20).nullable().default(null),
	})
	.strict()
	.refine((input) => Object.keys(input.ratings).length <= 12, "At most 12 ratings");

export const careAnswer = z.object({
	answer: text(900),
	followUps: z
		.array(z.string().transform((value) => value.trim().slice(0, 80)))
		.default([])
		.transform((items) => items.filter(Boolean).slice(0, 3)),
});

export type AskCareInput = z.infer<typeof askCareSchema>;
export type CareAnswer = z.infer<typeof careAnswer>;
