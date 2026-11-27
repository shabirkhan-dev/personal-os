import { AI_LIMITS, type AiConfig } from "./config";
import { AiError } from "./errors";
import { timeoutSignal } from "./timeout";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

type LiveConfig = Extract<AiConfig, { provider: "openai_compatible" }>;

/** "https://x/v1//" → "https://x/v1", without a regex (the address can come from the person). */
function withoutTrailingSlashes(url: string): string {
	let end = url.length;
	while (end > 0 && url[end - 1] === "/") end -= 1;
	return url.slice(0, end);
}

/** One chat completion from an OpenAI-compatible API, asking for a JSON object. */
export async function completeJson(
	config: LiveConfig,
	messages: readonly ChatMessage[],
	fetcher: typeof fetch = fetch,
): Promise<string> {
	let response: Response;
	try {
		response = await fetcher(`${withoutTrailingSlashes(config.baseUrl)}/chat/completions`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${config.apiKey}`,
				"Content-Type": "application/json",
				...config.headers,
			},
			body: JSON.stringify({
				model: config.model,
				messages,
				temperature: 0.4,
				max_tokens: config.maxTokens ?? AI_LIMITS.maxOutputTokens,
				response_format: { type: "json_object" },
				...config.extraBody,
			}),
			signal: timeoutSignal(config.timeoutMs ?? AI_LIMITS.timeoutMs),
		});
	} catch (error) {
		throw new AiError("unavailable", { cause: error });
	}
	if (!response.ok) {
		const detail = await response.text().catch(() => "");
		console.error(`[ai] provider answered ${response.status}: ${detail.slice(0, 300)}`);
		if (response.status === 401 || response.status === 403) throw new AiError("unauthorized");
		if (response.status === 429 || response.status === 402) throw new AiError("rate_limited");
		throw new AiError("unavailable");
	}
	const payload = (await response.json().catch(() => null)) as {
		choices?: { message?: { content?: unknown } }[];
	} | null;
	const content = payload?.choices?.[0]?.message?.content;
	if (typeof content !== "string" || !content.trim()) throw new AiError("invalid_output");
	return content;
}

/** Checks a key and model with the smallest possible request; throws an `AiError` when it fails. */
export async function checkProvider(
	config: LiveConfig,
	fetcher: typeof fetch = fetch,
): Promise<void> {
	await completeJson(
		config,
		[
			{ role: "system", content: 'Reply with the JSON object {"ok": true} and nothing else.' },
			{ role: "user", content: "ping" },
		],
		fetcher,
	);
}
