import type { ModelChunk, ModelMessage } from "./assistant.provider";

/**
 * A stand-in model for development and tests: for a new question it reads the job hunt with
 * `career_overview`, then answers from the tool's result. Deterministic, no network.
 */
export async function* mockCompletion(
	messages: readonly ModelMessage[],
): AsyncGenerator<ModelChunk> {
	const last = messages.at(-1);
	if (last?.role === "user") {
		yield { type: "text", delta: "Let me look." };
		yield {
			type: "tool_calls",
			calls: [
				{
					id: `mock_${messages.length}`,
					type: "function",
					function: { name: "career_overview", arguments: "{}" },
				},
			],
		};
		return;
	}
	if (last?.role === "tool") {
		const result = safeJson(last.content);
		const active = typeof result === "object" && result && "byStage" in result ? result : null;
		yield {
			type: "text",
			delta: active
				? " Here's where your job hunt stands. (Mock AI: set AI_PROVIDER to use a real model.)"
				: " Done.",
		};
		return;
	}
	yield { type: "text", delta: "Mock AI is on." };
}

function safeJson(text: string): unknown {
	try {
		return JSON.parse(text);
	} catch {
		return null;
	}
}
