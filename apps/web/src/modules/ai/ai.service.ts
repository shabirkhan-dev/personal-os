import { apiClient } from "@/lib/api/client";

export type AssistMessage = {
	role: "user" | "assistant" | "system";
	content: string;
};

export type AssistResponse = {
	reply: string;
	provider: string;
	model: string;
};

export type AiStatus = {
	ok: boolean;
	provider?: string;
};

export const aiService = {
	status: (accessToken: string) => apiClient.get<AiStatus>("/ai/status", { accessToken }),
	assist: (
		accessToken: string,
		input: { messages: AssistMessage[]; context?: string },
	): Promise<AssistResponse> =>
		apiClient.post<AssistResponse>("/ai/assist", input, { accessToken }),
};
