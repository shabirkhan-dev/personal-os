import * as z from "zod";

/**
 * The Career AI contract. Requests are strict; model answers are tolerant (extra keys dropped,
 * long text trimmed, long lists cut) but must have the right shape, or the task fails.
 */

export const stages = ["saved", "applied", "interview", "offer", "closed"] as const;
export const tones = ["as-is", "shorter", "warmer", "formal"] as const;

/** Model text: trimmed and cut to `max` characters instead of failing. */
const text = (max: number) =>
	z
		.string()
		.default("")
		.transform((value) => value.trim().slice(0, max));
const list = <Item extends z.ZodType>(item: Item, min: number, max: number) =>
	z
		.array(item)
		.min(min)
		.transform((items) => items.slice(0, max));

const halal = z.object({
	status: z.enum(["clean", "flagged", "unsure"]).catch("unsure"),
	note: text(240),
});

const story = z.object({ title: z.string().max(80), summary: z.string().max(200) }).strict();
const stories = z.array(story).max(6).default([]);

// --- read-job --------------------------------------------------------------------------------

export const readJobSchema = z
	.object({
		url: z
			.url({ protocol: /^https?$/ })
			.max(2048)
			.optional(),
		text: z.string().trim().max(20_000).optional(),
	})
	.strict()
	.refine((input) => Boolean(input.url) !== Boolean(input.text), "Send either url or text");

export const jobDetails = z.object({
	company: text(120),
	role: text(120),
	pay: text(80).describe("As written, with currency, e.g. 'Rs 450k–550k / mo'"),
	where: text(80).describe("e.g. 'Remote · UK hours'"),
	summary: text(400),
	halal,
});

// --- parse-line ------------------------------------------------------------------------------

export const parseLineSchema = z
	.object({
		text: z.string().trim().min(1).max(500),
		today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "The user's local date, YYYY-MM-DD"),
	})
	.strict();

export const parsedLine = z.object({
	application: z
		.object({
			company: text(120),
			role: text(120),
			pay: text(80),
			where: text(80),
			stage: z.enum(stages),
			halal,
		})
		.nullable()
		.describe("null when the line is not about a job"),
	followUpInDays: z.number().int().min(1).max(60).nullable().catch(null).default(null),
	interviewAt: z
		.string()
		.nullable()
		.catch(null)
		.default(null)
		.describe("ISO date-time if the line books an interview"),
});

// --- nudge -----------------------------------------------------------------------------------

export const nudgeSchema = z
	.object({
		senderName: z.string().max(80),
		company: z.string().max(120),
		role: z.string().max(120).default(""),
		contactName: z.string().max(80).default(""),
		daysSinceApplied: z.number().int().min(0).max(365),
		notes: z.string().max(2_000).default(""),
		stories,
		tone: z.enum(tones).default("as-is"),
		currentDraft: z.string().max(4_000).optional(),
	})
	.strict();

export const nudgeDraft = z.object({ subject: text(120), body: text(2_000) });

// --- interview-prep --------------------------------------------------------------------------

export const interviewPrepSchema = z
	.object({
		company: z.string().max(120),
		role: z.string().max(120).default(""),
		round: z.string().max(80).default(""),
		notes: z.string().max(2_000).default(""),
		stories,
	})
	.strict();

export const interviewPrep = z.object({
	topics: list(z.object({ title: text(80), detail: text(160) }), 1, 8),
	questions: list(
		z.string().transform((value) => value.trim().slice(0, 200)),
		1,
		6,
	),
	flashcards: list(
		z.object({
			topic: text(80).describe("Which prep topic the card belongs to"),
			tag: text(40).describe("Short eyebrow, e.g. 'React · effects'"),
			front: text(200),
			back: text(300),
			code: text(200),
		}),
		1,
		20,
	),
});

// --- skill-path ------------------------------------------------------------------------------

export const skillPathSchema = z
	.object({
		focus: z.string().trim().min(2).max(80),
		weeks: z.number().int().min(2).max(12).default(6),
		context: z.string().max(1_000).default(""),
	})
	.strict();

export const skillPath = z.object({
	title: text(60),
	weeks: list(
		z.object({
			title: text(60),
			goal: text(120),
			days: z.array(z.object({ title: text(60), detail: text(120) })).length(5),
		}),
		2,
		12,
	),
});

export type ReadJobInput = z.infer<typeof readJobSchema>;
export type JobDetails = z.infer<typeof jobDetails>;
export type ParseLineInput = z.infer<typeof parseLineSchema>;
export type ParsedLine = z.infer<typeof parsedLine>;
export type NudgeInput = z.infer<typeof nudgeSchema>;
export type NudgeDraft = z.infer<typeof nudgeDraft>;
export type InterviewPrepInput = z.infer<typeof interviewPrepSchema>;
export type InterviewPrep = z.infer<typeof interviewPrep>;
export type SkillPathInput = z.infer<typeof skillPathSchema>;
export type SkillPath = z.infer<typeof skillPath>;
