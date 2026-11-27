import type { AssistantContext, Card, ToolEffect } from "@personal-os/domain/assistant";
import type * as z from "zod";

import type { AssistantStore, UndoWrite } from "./store";

export type ToolContext = {
	/** The person's records, memory and profile: on the server, or on the phone. */
	store: AssistantStore;
	now: Date;
	/** Where the person is, and their time zone. */
	context: AssistantContext;
};

export type { UndoWrite };

export type ToolOutcome = {
	/** What the model reads back: short, plain JSON with ids and names, never whole documents. */
	result: unknown;
	/** What the person sees in the chat. */
	cards?: Card[];
	/** Collections written, so the phone syncs them at once. */
	changed?: string[];
	/** How to take the change back. */
	undo?: UndoWrite[];
};

export type Tool<Input = unknown> = {
	name: string;
	/** For the model: what the tool does, when to use it, and what it returns. */
	description: string;
	input: z.ZodType<Input>;
	effect: ToolEffect;
	/** The step shown while it runs: "Checking your applications". */
	label: (input: Input) => string;
	/** For writes: what the person is asked to approve. Reads never ask. */
	describe?: (ctx: ToolContext, input: Input) => Promise<{ title: string; detail: string }>;
	run: (ctx: ToolContext, input: Input) => Promise<ToolOutcome>;
};

/** Keeps the input type checked inside a tool while the registry holds tools of any input. */
export function defineTool<Input>(tool: Tool<Input>): Tool<unknown> {
	return tool as Tool<unknown>;
}

/** A failure the model can act on, like "two applications match; ask which one". */
export class ToolError extends Error {
	constructor(
		message: string,
		readonly hint?: unknown,
	) {
		super(message);
		this.name = "ToolError";
	}
}
