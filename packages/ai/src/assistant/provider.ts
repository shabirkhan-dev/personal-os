import { AI_LIMITS, type AiConfig } from "../config";
import { AiError } from "../errors";
import { timeoutSignal } from "../timeout";

/** A message in the OpenAI chat format, the one every compatible provider speaks. */
export type ModelMessage =
	| { role: "system" | "user"; content: string }
	| { role: "assistant"; content: string | null; tool_calls?: ModelToolCall[] }
	| { role: "tool"; tool_call_id: string; content: string };

export type ModelToolCall = {
	id: string;
	type: "function";
	function: { name: string; arguments: string };
};

export type ModelTool = {
	type: "function";
	function: { name: string; description: string; parameters: unknown };
};

/** What one model call produces, piece by piece. */
export type ModelChunk =
	| { type: "text"; delta: string }
	| { type: "tool_calls"; calls: ModelToolCall[] };

type ProviderConfig = Extract<AiConfig, { provider: "openai_compatible" }>;

type StreamDelta = {
	choices?: {
		delta?: {
			content?: string | null;
			tool_calls?: {
				index: number;
				id?: string;
				function?: { name?: string; arguments?: string };
			}[];
		};
	}[];
};

/** "https://x/v1//" → "https://x/v1", without a regex (the address can come from the person). */
function withoutTrailingSlashes(url: string): string {
	let end = url.length;
	while (end > 0 && url[end - 1] === "/") end -= 1;
	return url.slice(0, end);
}

/**
 * One streamed chat completion with tools. Text arrives as it is written; tool calls arrive
 * whole once the model finishes them (their arguments stream in pieces and are joined here).
 * `fetcher` must support streamed bodies (React Native passes `expo/fetch`).
 */
export async function* streamCompletion(
	config: ProviderConfig,
	messages: readonly ModelMessage[],
	tools: readonly ModelTool[],
	fetcher: typeof fetch = fetch,
): AsyncGenerator<ModelChunk> {
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
				tools: tools.length > 0 ? tools : undefined,
				temperature: 0.3,
				max_tokens: config.maxTokens ?? AI_LIMITS.maxOutputTokens,
				stream: true,
				...config.extraBody,
			}),
			signal: timeoutSignal(config.timeoutMs ?? AI_LIMITS.timeoutMs),
		});
	} catch (error) {
		throw new AiError("unavailable", { cause: error });
	}
	if (!response.ok || !response.body) {
		const detail = await response.text().catch(() => "");
		console.error(`[assistant] provider answered ${response.status}: ${detail.slice(0, 300)}`);
		if (response.status === 401 || response.status === 403) throw new AiError("unauthorized");
		if (response.status === 429 || response.status === 402) throw new AiError("rate_limited");
		throw new AiError("unavailable");
	}

	const calls = new Map<number, ModelToolCall>();
	for await (const data of serverSentData(response.body)) {
		if (data === "[DONE]") break;
		let chunk: StreamDelta;
		try {
			chunk = JSON.parse(data) as StreamDelta;
		} catch {
			continue;
		}
		const delta = chunk.choices?.[0]?.delta;
		if (!delta) continue;
		if (delta.content) yield { type: "text", delta: delta.content };
		for (const part of delta.tool_calls ?? []) {
			const call = calls.get(part.index) ?? {
				id: "",
				type: "function" as const,
				function: { name: "", arguments: "" },
			};
			if (part.id) call.id = part.id;
			if (part.function?.name) call.function.name += part.function.name;
			if (part.function?.arguments) call.function.arguments += part.function.arguments;
			calls.set(part.index, call);
		}
	}
	if (calls.size > 0) {
		yield {
			type: "tool_calls",
			calls: [...calls.keys()]
				.toSorted((a, b) => a - b)
				.map((index) => {
					const call = calls.get(index) as ModelToolCall;
					if (!call.id) call.id = `call_${index}`;
					return call;
				}),
		};
	}
}

/** The `data:` payloads of a server-sent event stream. */
export async function* serverSentData(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
	const reader = body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	for (;;) {
		// oxlint-disable-next-line eslint/no-await-in-loop -- streaming read
		const { value, done } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });
		let end = buffer.indexOf("\n");
		while (end !== -1) {
			const line = buffer.slice(0, end).trim();
			buffer = buffer.slice(end + 1);
			if (line.startsWith("data:")) yield line.slice(5).trim();
			end = buffer.indexOf("\n");
		}
	}
	const last = buffer.trim();
	if (last.startsWith("data:")) yield last.slice(5).trim();
}
