import type { ContentfulStatusCode } from "hono/utils/http-status";

/**
 * Every error the API can answer with: its code (stable, what the app branches on), HTTP status
 * and the sentence shown to people. Routes throw `new AppError("CODE")`; nothing else writes an
 * error message or picks a status.
 */
export const errors = {
	// Request
	VALIDATION_FAILED: { status: 400, message: "Some fields are missing or invalid." },
	BODY_TOO_LARGE: { status: 413, message: "The request is too large." },
	NOT_FOUND: { status: 404, message: "Nothing lives at this address." },
	RATE_LIMITED: { status: 429, message: "Too many requests. Wait a minute and try again." },
	AI_QUOTA_REACHED: {
		status: 429,
		message: "You've used today's AI help. It resets tomorrow; everything else still works.",
	},
	INTERNAL_ERROR: { status: 500, message: "Something went wrong on our side. Try again." },
	NOT_READY: { status: 503, message: "The service is starting up or degraded. Try again shortly." },
	/** The missing settings are logged by name; callers only learn that something is missing. */
	CONFIG_INVALID: { status: 503, message: "The API's settings are incomplete." },

	// Auth
	AUTH_REQUIRED: { status: 401, message: "Sign in to continue." },
	AUTH_ACCESS_TOKEN_INVALID: { status: 401, message: "Your session expired. Sign in again." },
	AUTH_SESSION_INVALID: { status: 401, message: "This session has ended. Sign in again." },
	AUTH_REFRESH_TOKEN_INVALID: { status: 401, message: "This session has ended. Sign in again." },
	AUTH_CODE_INVALID: { status: 401, message: "That code is wrong or has expired." },
	EMAIL_DELIVERY_FAILED: {
		status: 503,
		message: "The sign-in email could not be sent. Try again shortly.",
	},

	// Assets
	ASSETS_UNAVAILABLE: { status: 503, message: "Uploads are not set up yet." },
	ASSET_NOT_UPLOADED: { status: 400, message: "The file was not uploaded. Try again." },
	ASSET_INVALID: { status: 400, message: "Use a JPEG, PNG or WebP image under 5 MB." },

	// Sync

	// AI
	AI_UNAVAILABLE: { status: 503, message: "AI is not reachable right now. Try again shortly." },
	AI_INVALID_OUTPUT: { status: 502, message: "AI gave an answer we couldn't use. Try again." },
	JOB_LINK_UNREADABLE: {
		status: 422,
		message: "The page needs a sign-in or blocks reading. Paste the job text instead.",
	},

	// Assistant
	ASSISTANT_THREAD_NOT_FOUND: { status: 404, message: "That conversation doesn't exist." },
	ASSISTANT_NOTHING_TO_APPROVE: {
		status: 409,
		message: "That change was already decided. Ask again if you still want it.",
	},
	ASSISTANT_NOTHING_TO_UNDO: { status: 409, message: "That change was already undone." },
	ASSISTANT_MEMORY_NOT_FOUND: { status: 404, message: "That memory is already gone." },
} as const satisfies Record<string, { status: ContentfulStatusCode; message: string }>;

export type ErrorCode = keyof typeof errors;

/** Sentences the API sends back on success, kept here for the same reason. */
export const messages = {
	SIGN_IN_CODE_SENT: "If that email can sign in, a code is on its way.",
} as const;
