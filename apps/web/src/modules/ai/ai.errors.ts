import { ApiError } from "@/lib/api/client";

export function aiErrorMessage(error: unknown): string {
	if (error instanceof ApiError) {
		if (error.statusCode === 401) return "Your session expired. Sign in again to continue.";
		if (error.statusCode === 403) return "You do not have access to this conversation.";
		if (error.statusCode === 404) return "This conversation is no longer available.";
		if (error.statusCode === 429) return "Too many requests. Wait a moment before trying again.";
		if (error.code === "AI_SESSION_MESSAGE_LIMIT")
			return "This conversation is full. Start a new conversation.";
		if (error.code === "AI_UNAVAILABLE")
			return "AI is temporarily unavailable. Please try again later.";
		if (error.statusCode === 502)
			return "The AI provider could not return a valid response. Please try again later.";
	}
	if (error instanceof Error && error.name === "TimeoutError")
		return "The request timed out. Check the conversation before sending again.";
	return "Could not reach Personal OS AI. Check your connection and try again.";
}
