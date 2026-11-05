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

// --- design-routine --------------------------------------------------------------------------

export const designRoutineSchema = z
	.object({
		concerns: z.array(z.string().trim().min(1).max(30)).max(12).default([]),
		skin: z.array(z.string().trim().min(1).max(30)).max(4).default([]),
		/** Anything else: "5 minutes max", "no fragrance", "I already use CeraVe". */
		notes: z.string().trim().max(400).default(""),
		/** What is already on the shelf, so the routine uses it. */
		products: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
	})
	.strict();

const days = z
	.array(z.number().int().min(0).max(6))
	.default([])
	.transform((items) => [...new Set(items)].toSorted((a, b) => a - b));

export const routineDraft = z.object({
	steps: z
		.array(
			z.object({
				routine: z.enum(["morning", "night"]).catch("morning"),
				area: z.enum(["face", "hair", "body"]).catch("face"),
				name: text(60),
				detail: text(80).describe("One short line: '3 drops · let it dry'"),
				howTo: text(600).describe("How to apply it, in a few plain sentences"),
				minutes: z.number().int().min(0).max(60).catch(1),
				days: days.describe("Weekdays (0 = Sunday) for weekly steps; empty for every day"),
			}),
		)
		.default([])
		.transform((items) => items.filter((item) => item.name).slice(0, 16)),
	habits: z
		.array(z.object({ name: text(60), detail: text(60) }))
		.default([])
		.transform((items) => items.filter((item) => item.name).slice(0, 6)),
	note: text(240),
});

export type DesignRoutineInput = z.infer<typeof designRoutineSchema>;
export type RoutineDraft = z.infer<typeof routineDraft>;
export type AskCareInput = z.infer<typeof askCareSchema>;
export type CareAnswer = z.infer<typeof careAnswer>;
