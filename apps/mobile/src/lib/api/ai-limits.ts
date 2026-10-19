import { ApiError } from "./client";

/**
 * What to say when AI can't run for a reason every module shares: today's allowance is used up,
 * AI is switched off on the server, too many requests, or this build has no server. `null` for
 * anything else, which each module words for itself.
 */
export function aiLimitMessage(error: unknown): string | null {
	if (!(error instanceof ApiError)) return null;
	switch (error.code) {
		case "AI_QUOTA_REACHED":
		case "API_NOT_CONFIGURED":
			return error.message;
		case "AI_UNAVAILABLE":
			return "AI is off right now. Everything else still works.";
		case "RATE_LIMITED":
			return "That's a lot of requests at once. Wait a minute and try again.";
		default:
			return null;
	}
}
