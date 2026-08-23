import * as z from 'zod';

export const ROUTINE_SCHEDULE_TYPES = ['daily', 'specific_days'] as const;

const weekdaysSchema = z.number().int().min(1).max(7);

const itemInputSchema = z.object({
	name: z.string().trim().min(1).max(200),
	notes: z.string().trim().max(1000).nullable().optional(),
	targetTime: z
		.string()
		.regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected time as HH:MM')
		.nullable()
		.optional(),
});

export const createRoutineSchema = z
	.object({
		name: z.string().trim().min(1).max(120),
		description: z.string().trim().max(500).nullable().optional(),
		scheduleType: z.enum(ROUTINE_SCHEDULE_TYPES).default('daily'),
		daysOfWeek: z.array(weekdaysSchema).max(7).optional(),
		items: z.array(itemInputSchema).max(50).optional(),
	})
	.strict()
	.refine(
		(input) => input.scheduleType !== 'specific_days' || (input.daysOfWeek?.length ?? 0) > 0,
		'daysOfWeek is required when scheduleType is specific_days',
	);

export const updateRoutineSchema = z
	.object({
		name: z.string().trim().min(1).max(120).optional(),
		description: z.string().trim().max(500).nullable().optional(),
		scheduleType: z.enum(ROUTINE_SCHEDULE_TYPES).optional(),
		daysOfWeek: z.array(weekdaysSchema).max(7).optional(),
		items: z.array(itemInputSchema).max(50).optional(),
		archived: z.boolean().optional(),
	})
	.strict()
	.refine((input) => Object.keys(input).length > 0, 'At least one routine field is required');

export type RoutineItemInput = z.infer<typeof itemInputSchema>;
export type CreateRoutineInput = z.infer<typeof createRoutineSchema>;
export type UpdateRoutineInput = z.infer<typeof updateRoutineSchema>;

/** Carries the Zod schema for the global validation pipe; instances never outlive the request. */
export class CreateRoutineDto implements CreateRoutineInput {
	static schema = createRoutineSchema;
	name!: string;
	description?: string | null;
	scheduleType!: CreateRoutineInput['scheduleType'];
	daysOfWeek?: number[];
	items?: RoutineItemInput[];
}

export class UpdateRoutineDto implements UpdateRoutineInput {
	static schema = updateRoutineSchema;
	name?: string;
	description?: string | null;
	scheduleType?: UpdateRoutineInput['scheduleType'];
	daysOfWeek?: number[];
	items?: RoutineItemInput[];
	archived?: boolean;
}
