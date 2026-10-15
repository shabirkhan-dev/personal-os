import * as z from "zod";

import { settings } from "@/config/settings";

const { maxPush, maxRecordBytes } = settings.sync;
const millis = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const byteLength = (value: unknown) => new TextEncoder().encode(JSON.stringify(value) ?? "").length;

export const syncRecordSchema = z
	.object({
		collection: z.string().regex(/^[a-z][a-z0-9-]{0,63}$/),
		id: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/),
		data: z.unknown().refine((value) => value !== undefined, "data is required"),
		updatedAt: millis,
		deletedAt: millis.nullable(),
	})
	.strict()
	.refine((record) => byteLength(record.data) <= maxRecordBytes, {
		message: `data must be at most ${maxRecordBytes} bytes`,
		path: ["data"],
	});

export const syncRequestSchema = z
	.object({
		cursor: z
			.string()
			.regex(/^\d{1,18}$/)
			.nullable(),
		changes: z.array(syncRecordSchema).max(maxPush),
	})
	.strict();

export type SyncRecordInput = z.infer<typeof syncRecordSchema>;
export type SyncRequest = z.infer<typeof syncRequestSchema>;

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
