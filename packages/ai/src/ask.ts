import * as z from "zod";

import type { AiConfig } from "./config";
import { AiError } from "./errors";
import { type ChatMessage, completeJson } from "./provider";

/**
 * Asks the model for one JSON object matching `schema` and validates the answer. `assistant` names
 * the module speaking ("Career", "Faith") so the model keeps to that role.
 */
export async function askJson<Schema extends z.ZodType>(
	config: AiConfig,
	assistant: string,
	task: string,
	instructions: string,
	content: string,
	schema: Schema,
): Promise<z.infer<Schema>> {
	if (config.provider !== "openai_compatible") throw new AiError("unavailable");
	const jsonSchema = JSON.stringify(z.toJSONSchema(schema, { io: "input" }));
	const system =
		`You are the ${assistant} assistant inside Personal OS. Reply with one JSON object that ` +
		`matches this JSON schema exactly, and nothing else.\nSchema: ${jsonSchema}\n\n` +
		`Task: ${instructions}`;
	const messages: ChatMessage[] = [
		{ role: "system", content: system },
		{ role: "user", content },
	];
	// An empty answer (a thinking model that ran out of room) gets one fresh try.
	const answer = await completeJson(config, messages).catch((error: unknown) => {
		if (error instanceof AiError && error.code === "invalid_output") {
			console.warn(`[ai] ${task} came back empty, asking again`);
			return completeJson(config, messages);
		}
		throw error;
	});
	let parsed = schema.safeParse(parseJson(answer));
	if (!parsed.success) {
		// Smaller (and free) models often get one field wrong: show them what, and ask once more.
		console.warn(`[ai] ${task} answer did not match the schema, asking again`);
		const retry = await completeJson(config, [
			...messages,
			{ role: "assistant", content: answer.slice(0, 6000) },
			{ role: "user", content: repairNote(parsed.error.issues) },
		]);
		parsed = schema.safeParse(parseJson(retry));
	}
	if (!parsed.success) {
		console.warn(`[ai] ${task} answer did not match the schema`, parsed.error.issues.slice(0, 5));
		throw new AiError("invalid_output");
	}
	return parsed.data;
}

/** What was wrong with an answer, for the one retry. */
function repairNote(issues: readonly z.core.$ZodIssue[]): string {
	const problems = issues
		.slice(0, 8)
		.map((issue) => `- ${issue.path.map(String).join(".") || "(root)"}: ${issue.message}`)
		.join("\n");
	return `That answer didn't match the schema:\n${problems}\nReply again with only the corrected JSON object.`;
}

/** The text inside a Markdown code fence (```json … ```), or the answer as it is. */
function unfenced(answer: string): string {
	const open = answer.indexOf("```");
	if (open === -1) return answer;
	const lineEnd = answer.indexOf("\n", open + 3);
	const close = answer.indexOf("```", open + 3);
	if (close === -1) return answer;
	const start = lineEnd !== -1 && lineEnd < close ? lineEnd + 1 : open + 3;
	return answer.slice(start, close).trim();
}

/** The model's JSON, with a Markdown code fence removed if it added one. */
export function parseJson(answer: string): unknown {
	try {
		return JSON.parse(unfenced(answer));
	} catch {
		return undefined;
	}
}
