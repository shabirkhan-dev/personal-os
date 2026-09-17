import { apiClient } from "@/lib/api/client";
import type {
	ChatMessagesResponse,
	ChatSession,
	ChatSessionsResponse,
	CreateChatSessionInput,
	DailyIntelligence,
	ListSessionsQuery,
	SendMessageInput,
	SendMessageResponse,
} from "../types/ai.types";

export const aiService = {
	getDaily: (accessToken: string) => apiClient.get<DailyIntelligence>("/ai/daily", { accessToken }),

	createSession: (accessToken: string, input: CreateChatSessionInput = {}) =>
		apiClient.post<ChatSession>("/ai/chat/sessions", input, { accessToken }),

	listSessions: (accessToken: string, query?: ListSessionsQuery) => {
		const searchParams = new URLSearchParams();
		if (query?.limit !== undefined) searchParams.set("limit", String(query.limit));
		if (query?.offset !== undefined) searchParams.set("offset", String(query.offset));
		const qs = searchParams.toString();
		return apiClient.get<ChatSessionsResponse>(`/ai/chat/sessions${qs ? `?${qs}` : ""}`, {
			accessToken,
		});
	},

	getMessages: (accessToken: string, sessionId: string, limit?: number) => {
		const searchParams = new URLSearchParams();
		if (limit !== undefined) searchParams.set("limit", String(limit));
		const qs = searchParams.toString();
		return apiClient.get<ChatMessagesResponse>(
			`/ai/chat/sessions/${sessionId}/messages${qs ? `?${qs}` : ""}`,
			{ accessToken },
		);
	},

	sendMessage: (accessToken: string, sessionId: string, input: SendMessageInput) =>
		apiClient.post<SendMessageResponse>(`/ai/chat/sessions/${sessionId}/messages`, input, {
			accessToken,
		}),
};
