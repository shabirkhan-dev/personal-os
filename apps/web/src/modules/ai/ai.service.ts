import { z } from "zod";
import { apiClient } from "@/lib/api/client";
import type {
	ChatMessage,
	ChatMessageList,
	ChatSession,
	CreateChatSessionInput,
	DailyIntelligence,
	SendMessageInput,
} from "./ai.types";

const sessionBase = z.object({
	id: z.string(),
	title: z.string().nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
});
const sessionSchema = z.union([
	sessionBase.extend({
		context: z.object({
			route: z.string().nullable(),
			entity: z.object({ type: z.string(), id: z.string() }).nullable(),
			date: z.string().nullable(),
		}),
	}),
	sessionBase
		.extend({
			contextRoute: z.string().nullable(),
			contextEntityType: z.string().nullable(),
			contextEntityId: z.string().nullable(),
			contextDate: z.string().nullable(),
		})
		.transform((session) => ({
			id: session.id,
			title: session.title,
			createdAt: session.createdAt,
			updatedAt: session.updatedAt,
			context: {
				route: session.contextRoute,
				entity:
					session.contextEntityType && session.contextEntityId
						? { type: session.contextEntityType, id: session.contextEntityId }
						: null,
				date: session.contextDate,
			},
		})),
]);

function options(accessToken: string, signal?: AbortSignal) {
	const timeout = AbortSignal.timeout(30_000);
	return { accessToken, signal: signal ? AbortSignal.any([signal, timeout]) : timeout };
}

export const aiService = {
	daily: (accessToken: string, signal?: AbortSignal) =>
		apiClient.get<DailyIntelligence>("/ai/daily", options(accessToken, signal)),
	createSession: async (accessToken: string, input: CreateChatSessionInput): Promise<ChatSession> =>
		sessionSchema.parse(
			await apiClient.post<unknown>("/ai/chat/sessions", input, options(accessToken)),
		),
	listSessions: async (accessToken: string, offset = 0, signal?: AbortSignal) => {
		const data = await apiClient.get<unknown>(
			`/ai/chat/sessions?limit=20&offset=${offset}`,
			options(accessToken, signal),
		);
		return z.object({ sessions: z.array(sessionSchema) }).parse(data);
	},
	messages: (accessToken: string, sessionId: string, signal?: AbortSignal) =>
		apiClient.get<ChatMessageList>(
			`/ai/chat/sessions/${encodeURIComponent(sessionId)}/messages?limit=200`,
			options(accessToken, signal),
		),
	sendMessage: (accessToken: string, sessionId: string, input: SendMessageInput) =>
		apiClient.post<{ message: ChatMessage }>(
			`/ai/chat/sessions/${encodeURIComponent(sessionId)}/messages`,
			input,
			options(accessToken),
		),
};
