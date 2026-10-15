import type { Config } from "@/config/env";
import { settings } from "@/config/settings";
import { AppError } from "@/core/app-error";

export type ChatMessage = { role: "system" | "user"; content: string };

/** One chat completion from an OpenAI-compatible API, asking for a JSON object. */
export async function completeJson(
	config: Extract<Config["ai"], { provider: "openai_compatible" }>,
	messages: readonly ChatMessage[],
): Promise<string> {
	let response: Response;
	try {
		response = await fetch(`${config.baseUrl}/chat/completions`, {
			method: "POST",
			headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
			body: JSON.stringify({
				model: config.model,
				messages,
				temperature: 0.4,
				response_format: { type: "json_object" },
			}),
			signal: AbortSignal.timeout(settings.ai.timeoutMs),
		});
	} catch (error) {
		throw new AppError("AI_UNAVAILABLE", { cause: error });
	}
	if (!response.ok) {
		const detail = await response.text().catch(() => "");
		console.error(`[ai] provider answered ${response.status}: ${detail.slice(0, 300)}`);
		throw new AppError("AI_UNAVAILABLE");
	}
	const payload = (await response.json().catch(() => null)) as {
		choices?: { message?: { content?: unknown } }[];
	} | null;
	const content = payload?.choices?.[0]?.message?.content;
	if (typeof content !== "string" || !content.trim()) throw new AppError("AI_INVALID_OUTPUT");
	return content;
}
