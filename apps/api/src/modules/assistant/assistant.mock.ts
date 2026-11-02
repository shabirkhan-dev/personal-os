import type { ModelChunk, ModelMessage } from "./assistant.provider";

/**
 * A stand-in model for development and tests: for a new question it reads the money (questions
 * about spending, bills, budget) or the job hunt, then answers. Deterministic, no network.
 */
export async function* mockCompletion(
	messages: readonly ModelMessage[],
): AsyncGenerator<ModelChunk> {
	const last = messages.at(-1);
	if (last?.role === "user") {
		const money = /money|spen[dt]|bill|budget|rs\b|afford/i.test(last.content);
		const training = /train|workout|run|gym|session|exercise/i.test(last.content);
		yield { type: "text", delta: "Let me look." };
		yield {
			type: "tool_calls",
			calls: [
				{
					id: `mock_${messages.length}`,
					type: "function",
					function: {
						name: money ? "finance_overview" : training ? "training_overview" : "career_overview",
						arguments: "{}",
					},
				},
			],
		};
		return;
	}
	if (last?.role === "tool") {
		const result = safeJson(last.content);
		const about =
			typeof result === "object" && result
				? "byStage" in result
					? "your job hunt"
					: "balance" in result
						? "your money"
						: "thisWeek" in result
							? "your training"
							: null
				: null;
		yield {
			type: "text",
			delta: about
				? ` Here's where ${about} stands. (Mock AI: set AI_PROVIDER to use a real model.)`
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
