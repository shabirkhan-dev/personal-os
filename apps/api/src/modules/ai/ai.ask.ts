import * as z from "zod";

import type { Config } from "@/config/env";
import { AppError } from "@/core/app-error";
import { completeJson } from "./ai.provider";

/**
 * Asks the model for one JSON object matching `schema` and validates the answer. `assistant` names
 * the module speaking ("Career", "Faith") so the model keeps to that role.
 */
export async function askJson<Schema extends z.ZodType>(
	config: Config,
	assistant: string,
	task: string,
	instructions: string,
	content: string,
	schema: Schema,
): Promise<z.infer<Schema>> {
	if (config.ai.provider !== "openai_compatible") throw new AppError("AI_UNAVAILABLE");
	const jsonSchema = JSON.stringify(z.toJSONSchema(schema, { io: "input" }));
	const system =
		`You are the ${assistant} assistant inside Personal OS. Reply with one JSON object that ` +
		`matches this JSON schema exactly, and nothing else.\nSchema: ${jsonSchema}\n\n` +
		`Task: ${instructions}`;
	const answer = await completeJson(config.ai, [
		{ role: "system", content: system },
		{ role: "user", content },
	]);
	const parsed = schema.safeParse(parseJson(answer));
	if (!parsed.success) {
		console.warn(`[ai] ${task} answer did not match the schema`, parsed.error.issues.slice(0, 5));
		throw new AppError("AI_INVALID_OUTPUT");
	}
	return parsed.data;
}

/** The model's JSON, with a Markdown code fence removed if it added one. */
function parseJson(answer: string): unknown {
	const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(answer);
	try {
		return JSON.parse(fenced?.[1] ?? answer);
	} catch {
		return undefined;
	}
}
