import * as z from 'zod';

export const assistMessageSchema = z
	.object({
		role: z.enum(['user', 'assistant', 'system']),
		content: z.string().trim().min(1).max(8_000),
	})
	.strict();

export const assistRequestSchema = z
	.object({
		messages: z.array(assistMessageSchema).min(1).max(40),
		context: z.string().trim().max(4_000).optional(),
	})
	.strict();

export class AssistRequestDto {
	static schema = assistRequestSchema;
	messages!: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
	context?: string;
}

export type AssistRequestInput = z.infer<typeof assistRequestSchema>;

export type AssistResponse = {
	reply: string;
	provider: string;
	model: string;
};

/** The Career AI tasks the app may call; each is proxied to `POST /api/v1/career/:task`. */
export const careerTasks = [
	'read-job',
	'parse-line',
	'nudge',
	'interview-prep',
	'skill-path',
] as const;
export type CareerTask = (typeof careerTasks)[number];

export const careerTaskSchema = z.enum(careerTasks);

/** The AI service validates the body per task; here it only has to be a small JSON object. */
export const careerTaskBodySchema = z
	.record(z.string(), z.unknown())
	.refine((body) => JSON.stringify(body).length <= 32_000, 'Request is too large');
