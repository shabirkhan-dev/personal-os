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
		/** Checked one by one in the service, so a bad record is skipped, not the whole batch. */
		changes: z.array(z.unknown()).max(maxPush),
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

/** A pushed record the server skipped; the phone stops resending it. */
export type SyncRejection = {
	collection: string | null;
	id: string | null;
	reason: "invalid" | "duplicate";
};

export type SyncResponse = {
	cursor: string;
	changes: SyncRecordView[];
	conflicts: SyncRecordView[];
	rejected: SyncRejection[];
	hasMore: boolean;
};
