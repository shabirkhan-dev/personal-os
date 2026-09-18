"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/modules/auth/context/auth-context";
import { aiService } from "./ai.service";

export function useDailyIntelligence() {
	const { user, token } = useAuth();
	return useQuery({
		queryKey: ["ai", user?.id, "daily"],
		queryFn: ({ signal }) => aiService.daily(requireToken(token), signal),
		enabled: Boolean(user && token),
		gcTime: 0,
		retry: false,
	});
}

export function useChatSessions() {
	const { user, token } = useAuth();
	return useInfiniteQuery({
		queryKey: ["ai", user?.id, "sessions"],
		initialPageParam: 0,
		queryFn: ({ pageParam, signal }) =>
			aiService.listSessions(requireToken(token), pageParam, signal),
		getNextPageParam: (page, _pages, offset) =>
			page.sessions.length === 20 ? offset + 20 : undefined,
		enabled: Boolean(user && token),
		gcTime: 0,
		retry: false,
	});
}

export function useChatMessages(sessionId: string | null) {
	const { user, token } = useAuth();
	return useQuery({
		queryKey: ["ai", user?.id, "messages", sessionId],
		queryFn: ({ signal }) => aiService.messages(requireToken(token), sessionId ?? "", signal),
		enabled: Boolean(user && token && sessionId),
		gcTime: 0,
		retry: false,
	});
}

function requireToken(token: string | null): string {
	if (!token) throw new Error("Please sign in to use Personal OS AI.");
	return token;
}
