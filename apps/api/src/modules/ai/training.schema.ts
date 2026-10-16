import * as z from "zod";

/** The Training AI contract. Requests are strict; model answers are trimmed, not failed. */

const text = (max: number) =>
	z
		.string()
		.default("")
		.transform((value) => value.trim().slice(0, max));

const line = (max: number) => z.string().trim().max(max);

export const askTrainingSchema = z
	.object({
		question: z.string().trim().min(1).max(500),
		today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "The user's local date, YYYY-MM-DD"),
		sports: z.array(line(20)).max(12).default([]),
		phase: z.number().int().min(1).max(3).default(1),
		week: z
			.array(z.object({ day: line(10), title: line(60), status: line(12) }).strict())
			.max(7)
			.default([]),
		recent: z
			.array(z.object({ day: line(10), title: line(60), line: line(120) }).strict())
			.max(10)
			.default([]),
	})
	.strict();

export const trainingAnswer = z.object({
	answer: text(900),
	followUps: z
		.array(z.string().transform((value) => value.trim().slice(0, 80)))
		.default([])
		.transform((items) => items.filter(Boolean).slice(0, 3)),
});

export const skillStepsSchema = z
	.object({
		name: z.string().trim().min(2).max(60),
		sport: line(20).default(""),
		level: line(120).default(""),
	})
	.strict();

export const skillSteps = z.object({
	steps: z
		.array(z.string().transform((value) => value.trim().slice(0, 120)))
		.default([])
		.transform((items) => items.filter(Boolean).slice(0, 8)),
});

export type AskTrainingInput = z.infer<typeof askTrainingSchema>;
export type TrainingAnswer = z.infer<typeof trainingAnswer>;
export type SkillStepsInput = z.infer<typeof skillStepsSchema>;
export type SkillSteps = z.infer<typeof skillSteps>;
