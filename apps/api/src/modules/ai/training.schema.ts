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

// --- program -----------------------------------------------------------------------------------

const catalogEntry = z
	.object({
		id: z.string().regex(/^[a-z0-9-]{1,40}$/),
		name: line(60),
		pattern: line(20),
		level: z.number().int().min(1).max(10),
		unit: z.enum(["reps", "s", "min"]),
	})
	.strict();

export const designProgramSchema = z
	.object({
		goal: z.string().trim().min(3).max(300),
		level: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
		weeks: z.number().int().min(2).max(16).default(8),
		daysPerWeek: z.number().int().min(1).max(7),
		minutes: z.number().int().min(15).max(120),
		sports: z.array(line(20)).max(12).default([]),
		equipment: z.array(line(20)).max(10).default([]),
		exercises: z.array(catalogEntry).min(5).max(150),
	})
	.strict();

/** Model numbers: coerced and rounded; out-of-range values are clamped by the task. */
const whole = z.coerce
	.number()
	.catch(0)
	.transform((value) => Math.round(value));

export const programDraft = z.object({
	title: text(60),
	summary: text(400),
	weeks: whole,
	sessions: z
		.array(
			z.object({
				title: text(40),
				sport: text(20),
				focus: text(20),
				minutes: whole,
				items: z
					.array(
						z.object({
							exercise: z.string().default(""),
							sets: whole,
							low: whole,
							high: whole,
							restS: whole,
						}),
					)
					.default([]),
			}),
		)
		.default([]),
	order: z.array(whole).default([]),
});

export type AskTrainingInput = z.infer<typeof askTrainingSchema>;
export type DesignProgramInput = z.infer<typeof designProgramSchema>;
export type ProgramDraft = z.infer<typeof programDraft>;
export type TrainingAnswer = z.infer<typeof trainingAnswer>;
export type SkillStepsInput = z.infer<typeof skillStepsSchema>;
export type SkillSteps = z.infer<typeof skillSteps>;
