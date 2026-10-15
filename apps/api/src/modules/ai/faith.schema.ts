import * as z from "zod";

/** The Faith AI contract: one question in, a short answer out. Answers are trimmed, not failed. */

const prayerId = z.enum(["fajr", "dhuhr", "asr", "maghrib", "isha"]);

export const askFaithSchema = z
	.object({
		question: z.string().trim().min(1).max(500),
		/** The tradition the person follows, in their own words ("Shia Ismaili", "Hanafi"). */
		tradition: z.string().trim().max(80).default(""),
		/** The user's local date, so "today" in the answer means their day. */
		today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "The user's local date, YYYY-MM-DD"),
		/** What they pray and what they logged today, for questions about their own routine. */
		prayers: z.array(prayerId).max(5).default([]),
		prayedToday: z.array(prayerId).max(5).default([]),
	})
	.strict();

export const faithAnswer = z.object({
	answer: z
		.string()
		.default("")
		.transform((value) => value.trim().slice(0, 1200)),
	/** Up to three follow-up questions the person might tap next. */
	followUps: z
		.array(z.string().transform((value) => value.trim().slice(0, 80)))
		.default([])
		.transform((items) => items.filter(Boolean).slice(0, 3)),
});

export type AskFaithInput = z.infer<typeof askFaithSchema>;
export type FaithAnswer = z.infer<typeof faithAnswer>;
