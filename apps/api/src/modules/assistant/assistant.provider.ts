import type { Config } from "@/config/env";
import { settings } from "@/config/settings";
import { AppError } from "@/core/app-error";

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

type ProviderConfig = Extract<Config["ai"], { provider: "openai_compatible" }>;

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

/**
 * One streamed chat completion with tools. Text arrives as it is written; tool calls arrive
 * whole once the model finishes them (their arguments stream in pieces and are joined here).
 */
export async function* streamCompletion(
	config: ProviderConfig,
	messages: readonly ModelMessage[],
	tools: readonly ModelTool[],
): AsyncGenerator<ModelChunk> {
	let response: Response;
	try {
		response = await fetch(`${config.baseUrl}/chat/completions`, {
			method: "POST",
			headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
			body: JSON.stringify({
				model: config.model,
				messages,
				tools: tools.length > 0 ? tools : undefined,
				temperature: 0.3,
				max_tokens: settings.ai.maxOutputTokens,
				stream: true,
			}),
			signal: AbortSignal.timeout(settings.ai.timeoutMs),
		});
	} catch (error) {
		throw new AppError("AI_UNAVAILABLE", { cause: error });
	}
	if (!response.ok || !response.body) {
		const detail = await response.text().catch(() => "");
		console.error(`[assistant] provider answered ${response.status}: ${detail.slice(0, 300)}`);
		throw new AppError("AI_UNAVAILABLE");
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
