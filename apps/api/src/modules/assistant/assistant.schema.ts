import * as z from "zod";

const timeZone = z.string().trim().min(1).max(64);

export const messageSchema = z
	.object({
		/** Omit to start a new conversation. */
		threadId: z.uuid().optional(),
		text: z.string().trim().min(1).max(4000),
		context: z
			.object({
				timeZone,
				module: z.string().trim().max(32).optional(),
				screen: z.string().trim().max(64).optional(),
				recordId: z.string().trim().max(64).optional(),
			})
			.strict(),
	})
	.strict();

export const approvalSchema = z
	.object({ callId: z.string().min(1).max(100), approve: z.boolean(), timeZone })
	.strict();

export const undoSchema = z.object({ callId: z.string().min(1).max(100) }).strict();
