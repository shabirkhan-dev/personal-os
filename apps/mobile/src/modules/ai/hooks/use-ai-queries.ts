import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/modules/auth";
import { aiService } from "../services/ai.service";
import type { ListSessionsQuery } from "../types/ai.types";

export const aiQueryKeys = {
	all: (userId?: string) => ["ai", userId] as const,
	daily: (userId?: string) => ["ai", userId, "daily"] as const,
	sessions: (userId?: string, query?: ListSessionsQuery) =>
		["ai", userId, "sessions", query] as const,
	messages: (userId?: string, sessionId?: string) => ["ai", userId, "messages", sessionId] as const,
};

export function useDailyIntelligenceQuery() {
	const { token, user } = useAuth();

	return useQuery({
		queryKey: aiQueryKeys.daily(user?.id),
		queryFn: () => {
			if (!token || !user) throw new Error("Authentication required");
			return aiService.getDaily(token);
		},
		enabled: Boolean(token && user),
		staleTime: 60_000,
	});
}

export function useChatSessionsQuery(query?: ListSessionsQuery) {
	const { token, user } = useAuth();

	return useQuery({
		queryKey: aiQueryKeys.sessions(user?.id, query),
		queryFn: () => {
			if (!token || !user) throw new Error("Authentication required");
			return aiService.listSessions(token, query);
		},
		enabled: Boolean(token && user),
		staleTime: 30_000,
	});
}

export function useChatMessagesQuery(sessionId?: string, limit?: number) {
	const { token, user } = useAuth();

	return useQuery({
		queryKey: aiQueryKeys.messages(user?.id, sessionId),
		queryFn: () => {
			if (!token || !user || !sessionId) {
				throw new Error("Authentication and valid session ID required");
			}
			return aiService.getMessages(token, sessionId, limit);
		},
		enabled: Boolean(token && user && sessionId),
		staleTime: 5_000,
	});
}
