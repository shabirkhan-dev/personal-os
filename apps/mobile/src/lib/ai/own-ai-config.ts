import type { AiConfig } from "@personal-os/ai";

/** The person's own AI key: which provider, which model, and reading what was saved. */

export const OWN_AI_PROVIDERS = {
	openrouter: {
		label: "OpenRouter",
		baseUrl: "https://openrouter.ai/api/v1",
		note: "One key for hundreds of models, including free ones.",
		keyUrl: "https://openrouter.ai/keys",
	},
	openai: {
		label: "OpenAI",
		baseUrl: "https://api.openai.com/v1",
		note: "Your OpenAI key, billed to your OpenAI account.",
		keyUrl: "https://platform.openai.com/api-keys",
	},
	custom: {
		label: "Other",
		baseUrl: "",
		note: "Any OpenAI-compatible endpoint: Groq, Gemini, Mistral, a server of your own…",
		keyUrl: null,
	},
} as const;

export type OwnAiProvider = keyof typeof OWN_AI_PROVIDERS;

export type OwnAi = { provider: OwnAiProvider; baseUrl: string; model: string; apiKey: string };

const isProvider = (value: unknown): value is OwnAiProvider =>
	typeof value === "string" && Object.hasOwn(OWN_AI_PROVIDERS, value);

/** Reads what was saved; anything incomplete or damaged counts as no key. */
export function parseOwnAi(raw: string | null): OwnAi | null {
	if (!raw) return null;
	try {
		const value = JSON.parse(raw) as Record<string, unknown>;
		const own = {
			provider: value.provider,
			baseUrl: typeof value.baseUrl === "string" ? value.baseUrl.trim() : "",
			model: typeof value.model === "string" ? value.model.trim() : "",
			apiKey: typeof value.apiKey === "string" ? value.apiKey.trim() : "",
		};
		if (!isProvider(own.provider) || !own.baseUrl.startsWith("https://")) return null;
		if (!own.model || !own.apiKey) return null;
		return { ...own, provider: own.provider };
	} catch {
		return null;
	}
}

/** The shared AI package's config for the person's key. */
export function ownAiConfig(own: OwnAi): AiConfig {
	return {
		provider: "openai_compatible",
		apiKey: own.apiKey,
		baseUrl: own.baseUrl,
		model: own.model,
		headers:
			own.provider === "openrouter"
				? {
						"HTTP-Referer": "https://github.com/shabirkhan-dev/personal-os",
						"X-Title": "Personal OS",
					}
				: undefined,
	};
}

/** "sk-or-…a1b2", so the screen can show which key is saved without showing the key. */
export function maskKey(key: string): string {
	return key.length <= 10 ? "••••" : `${key.slice(0, 5)}…${key.slice(-4)}`;
}
