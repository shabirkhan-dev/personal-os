import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/modules/auth";
import { aiService } from "../services/ai.service";
import type {
	ChatMessagesResponse,
	CreateChatSessionInput,
	SendMessageInput,
} from "../types/ai.types";
import { aiQueryKeys } from "./use-ai-queries";

export function useCreateChatSessionMutation() {
	const { token, user } = useAuth();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input?: CreateChatSessionInput) => {
			if (!token || !user) throw new Error("Authentication required");
			return aiService.createSession(token, input);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: aiQueryKeys.sessions(user?.id) });
		},
	});
}

export function useSendMessageMutation(sessionId: string) {
	const { token, user } = useAuth();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: SendMessageInput) => {
			if (!token || !user || !sessionId) {
				throw new Error("Authentication and valid session ID required");
			}
			return aiService.sendMessage(token, sessionId, input);
		},
		onSuccess: (response, variables) => {
			// Optimistically or deterministically append the newly returned message to the query cache
			queryClient.setQueryData<ChatMessagesResponse>(
				aiQueryKeys.messages(user?.id, sessionId),
				(old) => {
					if (!old) return { messages: [response.message] };

					// The backend returns the assistant's reply. If the user's message is not yet in the list,
					// let's ensure the list reflects both the user prompt and the assistant reply.
					const hasUserMsg = old.messages.some(
						(m) => m.role === "user" && m.content === variables.message,
					);

					const newMessages = [...old.messages];
					if (!hasUserMsg) {
						newMessages.push({
							id: `temp-user-${Date.now()}`,
							role: "user",
							content: variables.message,
							sources: null,
							suggestions: null,
							provider: null,
							model: null,
							latencyMs: null,
							createdAt: new Date().toISOString(),
						});
					}
					newMessages.push(response.message);

					return { messages: newMessages };
				},
			);

			// Also refresh sessions list so updated timestamps or snippet reflect activity
			queryClient.invalidateQueries({ queryKey: aiQueryKeys.sessions(user?.id) });
		},
	});
}
