import { AiError } from "@personal-os/ai";
import { ApiError } from "./client";

/**
 * What to say when AI can't run for a reason every module shares: today's allowance is used up,
 * AI is switched off on the server, too many requests, or this build has no server. `null` for
 * anything else, which each module words for itself. Errors from the person's own key are
 * worded here too.
 */
export function aiLimitMessage(error: unknown): string | null {
	if (error instanceof AiError) return ownKeyMessage(error);
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

/** Problems with the person's own key, which only they can fix. */
function ownKeyMessage(error: AiError): string {
	switch (error.code) {
		case "unauthorized":
			return "Your AI key was refused. Check it in Settings → Your AI key.";
		case "rate_limited":
			return "Your AI key is out of credit or rate limited. Wait a bit, or pick another model.";
		case "invalid_output":
			return "The model's answer couldn't be used. Try again, or pick a stronger model.";
		case "page_unreadable":
			return error.message;
		default:
			return "Your AI provider didn't answer. Check the connection, then try again.";
	}
}
