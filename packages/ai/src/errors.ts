/**
 * Why an AI task failed, without anything server-specific: the API turns these into its own
 * error responses, and the app into plain words.
 */
export type AiErrorCode =
	/** The provider couldn't be reached, timed out or answered with an error. */
	| "unavailable"
	/** The provider refused the key. */
	| "unauthorized"
	/** The provider is rate limiting this key, or its free quota is used up. */
	| "rate_limited"
	/** The answer wasn't the JSON the task asked for. */
	| "invalid_output"
	/** A link the task had to read couldn't be read; `message` says why. */
	| "page_unreadable";

export class AiError extends Error {
	readonly code: AiErrorCode;

	constructor(code: AiErrorCode, options?: { message?: string; cause?: unknown }) {
		super(options?.message ?? code, { cause: options?.cause });
		this.name = "AiError";
		this.code = code;
	}
}
