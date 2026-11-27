/**
 * Which model answers. `mock` gives canned answers (tests and local development); the
 * OpenAI-compatible provider covers OpenAI, OpenRouter, Groq, Gemini's compatible endpoint and
 * local servers alike.
 */
export type AiConfig =
	| { provider: "mock" }
	| { provider: "off" }
	| {
			provider: "openai_compatible";
			apiKey: string;
			baseUrl: string;
			model: string;
			/** Extra headers some providers ask for (OpenRouter's app name). */
			headers?: Record<string, string>;
			/** How long one answer may take; defaults to `AI_LIMITS.timeoutMs`. */
			timeoutMs?: number;
			/** The answer's token budget, thinking included; defaults to `AI_LIMITS.maxOutputTokens`. */
			maxTokens?: number;
			/** Extra request fields a provider understands (OpenRouter's reasoning effort). */
			extraBody?: Record<string, unknown>;
	  };

export const AI_LIMITS = {
	timeoutMs: 60_000,
	/** Caps each answer's length, and so its cost. */
	maxOutputTokens: 4000,
	page: { maxBytes: 2_000_000, maxRedirects: 3, maxText: 12_000, minText: 200, timeoutMs: 10_000 },
} as const;
