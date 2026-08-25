import * as z from 'zod';

const contextEntitySchema = z
	.object({
		type: z.enum(['routine', 'routine_item', 'finance_transaction', 'budget']),
		id: z.uuid(),
	})
	.strict();

/** Optional Personal OS context enrichment. Chat also works without any of it. */
export const chatContextSchema = z
	.object({
		route: z.string().trim().min(1).max(200).optional(),
		entity: contextEntitySchema.optional(),
		date: z
			.string()
			.regex(/^\d{4}-\d{2}-\d{2}$/)
			.optional(),
	})
	.strict();

export const createChatSessionSchema = z
	.object({
		title: z.string().trim().min(1).max(120).optional(),
		context: chatContextSchema.optional(),
	})
	.strict();

export const sendMessageSchema = z
	.object({
		message: z.string().trim().min(1).max(4_000),
		context: chatContextSchema.optional(),
	})
	.strict();

export type ChatContext = z.infer<typeof chatContextSchema>;
export type CreateChatSessionInput = z.infer<typeof createChatSessionSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export class CreateChatSessionDto {
	static schema = createChatSessionSchema;
	title?: string;
	context?: ChatContext;
}

export class SendMessageDto {
	static schema = sendMessageSchema;
	message!: string;
	context?: ChatContext;
}
