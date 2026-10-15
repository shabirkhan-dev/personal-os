import * as z from 'zod';

/** Matches the app's `PUSH_BATCH`. */
export const MAX_PUSH = 200;
export const PULL_PAGE = 500;
/** Per-record cap on the serialized JSON document. */
export const MAX_RECORD_BYTES = 64 * 1024;
/** Client clocks may run ahead a little; far-future versions would win every conflict forever. */
export const MAX_CLOCK_SKEW_MS = 24 * 60 * 60 * 1000;

const millis = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);

export const syncRecordSchema = z
	.object({
		collection: z.string().regex(/^[a-z][a-z0-9-]{0,63}$/),
		id: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/),
		data: z.unknown().refine((value) => value !== undefined, 'data is required'),
		updatedAt: millis,
		deletedAt: millis.nullable(),
	})
	.strict()
	.refine(
		(record) => Buffer.byteLength(JSON.stringify(record.data) ?? '', 'utf8') <= MAX_RECORD_BYTES,
		{ message: `data must be at most ${MAX_RECORD_BYTES} bytes`, path: ['data'] },
	);

export const syncRequestSchema = z
	.object({
		cursor: z
			.string()
			.regex(/^\d{1,18}$/)
			.nullable(),
		changes: z.array(syncRecordSchema).max(MAX_PUSH),
	})
	.strict();

export type SyncRecordInput = z.infer<typeof syncRecordSchema>;
export type SyncRequestInput = z.infer<typeof syncRequestSchema>;

export class SyncRequestDto {
	static schema = syncRequestSchema;
	cursor!: string | null;
	changes!: SyncRecordInput[];
}

export type SyncRecordView = {
	collection: string;
	id: string;
	data: unknown;
	updatedAt: number;
	deletedAt: number | null;
};

export type SyncResponse = {
	cursor: string;
	changes: SyncRecordView[];
	conflicts: SyncRecordView[];
	hasMore: boolean;
};
