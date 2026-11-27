// oxlint-disable eslint/no-await-in-loop -- a turn is a sequence: each step reads what the last one wrote
import {
	ASSISTANT_SETTINGS_COLLECTION,
	type AssistantEvent,
	type Card,
	defaultAssistantSettings,
	needsApproval,
	parseAssistantSettings,
} from "@personal-os/domain/assistant";
import * as z from "zod";

import type { AiConfig } from "../config";
import { AiError } from "../errors";
import { toModelMessages } from "./messages";
import { mockCompletion } from "./mock";
import { systemPrompt } from "./prompt";
import {
	type ModelChunk,
	type ModelMessage,
	type ModelTool,
	type ModelToolCall,
	streamCompletion,
} from "./provider";
import { AssistantError, type StoredMessage, type ThreadStore, type ToolContent } from "./store";
import { type Tool, type ToolContext, ToolError } from "./tool";
import { calendarTools } from "./tools/calendar.tools";
import { careTools } from "./tools/care.tools";
import { careerTools } from "./tools/career.tools";
import { faithTools } from "./tools/faith.tools";
import { fashionTools } from "./tools/fashion.tools";
import { financeTools } from "./tools/finance.tools";
import { foodTools } from "./tools/food.tools";
import { generalTools } from "./tools/general.tools";
import { healthTools } from "./tools/health.tools";
import { trainingTools } from "./tools/training.tools";
import { wishlistTools } from "./tools/wishlist.tools";

const TOOLS: readonly Tool[] = [
	...careerTools,
	...financeTools,
	...trainingTools,
	...foodTools,
	...careTools,
	...faithTools,
	...fashionTools,
	...wishlistTools,
	...healthTools,
	...calendarTools,
	...generalTools,
];
const byName = new Map(TOOLS.map((tool) => [tool.name, tool]));

/** The tools as the model sees them: name, description and a JSON schema of the input. */
export const modelTools: ModelTool[] = TOOLS.map((tool) => ({
	type: "function",
	function: {
		name: tool.name,
		description: tool.description,
		parameters: z.toJSONSchema(tool.input, { io: "input" }),
	},
}));

/** Model calls in one turn, so a confused model can't loop forever. */
const MAX_STEPS = 8;

export type TurnDeps = {
	config: AiConfig;
	ctx: ToolContext;
	threadId: string;
	threads: ThreadStore;
	/** Runs before each model call: the server counts it against the daily allowance. */
	beforeCall?: () => Promise<void>;
	/** A fetch that can stream (React Native passes `expo/fetch`). */
	fetcher?: typeof fetch;
};

type Emit = (event: AssistantEvent) => Promise<void>;

/** Runs the model until it answers without calling a tool, or a change waits for approval. */
export async function runTurn(deps: TurnDeps, emit: Emit): Promise<void> {
	const { ctx, threadId, threads } = deps;
	const changed = new Set<string>();
	const [profile, memories, settingsRows] = await Promise.all([
		ctx.store.profile(),
		ctx.store.memories(),
		ctx.store.list(ASSISTANT_SETTINGS_COLLECTION, parseAssistantSettings),
	]);
	const approval = (settingsRows[0] ?? defaultAssistantSettings).approval;
	const system: ModelMessage = {
		role: "system",
		content: systemPrompt({
			now: ctx.now,
			context: ctx.context,
			name: profile.name,
			modules: profile.modules,
			memories,
			approval,
		}),
	};

	for (let step = 0; step < MAX_STEPS; step += 1) {
		const history = toModelMessages(await threads.loadMessages(threadId));
		const calls = await callModel(deps, [system, ...history], emit);
		if (calls.length === 0) {
			await emit({ type: "done", changed: [...changed], waiting: false });
			return;
		}
		const waiting = await runCalls(deps, calls, approval, emit, changed);
		if (waiting) {
			await emit({ type: "done", changed: [...changed], waiting: true });
			return;
		}
	}
	await emit({
		type: "text",
		delta: "\n\nI stopped there to keep this short. Ask me to carry on.",
	});
	await emit({ type: "done", changed: [...changed], waiting: false });
}

/** One model call: streams its text to the app, saves its message and returns its tool calls. */
async function callModel(deps: TurnDeps, messages: ModelMessage[], emit: Emit) {
	const { config, threadId, threads } = deps;
	if (config.provider === "off") throw new AiError("unavailable");
	await deps.beforeCall?.();
	const chunks: AsyncIterable<ModelChunk> =
		config.provider === "mock"
			? mockCompletion(messages)
			: streamCompletion(config, messages, modelTools, deps.fetcher);
	let text = "";
	let calls: ModelToolCall[] = [];
	for await (const chunk of chunks) {
		if (chunk.type === "text") {
			text += chunk.delta;
			await emit({ type: "text", delta: chunk.delta });
		} else {
			calls = chunk.calls;
		}
	}
	await threads.addMessage(threadId, {
		role: "assistant",
		content: { text, ...(calls.length > 0 ? { toolCalls: calls } : {}) },
	});
	return calls;
}

/**
 * Runs a batch of tool calls in order. A call that needs approval, and every call after it, is
 * stored as pending; those run once the person has decided (see `decide`). Returns whether the
 * turn now waits for them.
 */
async function runCalls(
	deps: TurnDeps,
	calls: readonly ModelToolCall[],
	approval: Parameters<typeof needsApproval>[0],
	emit: Emit,
	changed: Set<string>,
): Promise<boolean> {
	const { ctx, threadId, threads } = deps;
	let waiting = false;
	for (const call of calls) {
		const tool = byName.get(call.function.name);
		const parsed = tool ? parseInput(tool, call.function.arguments) : null;
		if (!tool || !parsed || !parsed.success) {
			const result = !tool
				? `No tool named ${call.function.name}.`
				: `Invalid input: ${parsed && !parsed.success ? z.prettifyError(parsed.error) : "not JSON"}. Fix it and call again.`;
			await threads.addMessage(threadId, {
				role: "tool",
				content: {
					callId: call.id,
					name: call.function.name,
					input: null,
					label: "Checking",
					status: "failed",
					needsApproval: false,
					result,
					cards: [],
				},
			});
			continue;
		}
		const input = parsed.data;
		const label = tool.label(input);
		const asks = needsApproval(approval, tool.effect);
		if (asks || waiting) {
			const cards: Card[] = [];
			if (asks) {
				const about = await describe(tool, ctx, input);
				cards.push({
					kind: "approval",
					callId: call.id,
					...about,
					effect: tool.effect,
					state: "waiting",
				});
				await emit({ type: "card", card: cards[0] as Card });
			}
			await threads.addMessage(threadId, {
				role: "tool",
				content: {
					callId: call.id,
					name: tool.name,
					input,
					label,
					status: "pending",
					needsApproval: asks,
					result: null,
					cards,
				},
			});
			waiting = true;
			continue;
		}
		const content: ToolContent = {
			callId: call.id,
			name: tool.name,
			input,
			label,
			status: "done",
			needsApproval: false,
			result: null,
			cards: [],
		};
		const id = await threads.addMessage(threadId, {
			role: "tool",
			content: { ...content, status: "approved" },
		});
		await execute(deps, id, tool, content, emit, changed);
	}
	return waiting;
}

function parseInput(tool: Tool, raw: string) {
	try {
		return tool.input.safeParse(raw.trim() ? JSON.parse(raw) : {});
	} catch {
		return null;
	}
}

async function describe(tool: Tool, ctx: ToolContext, input: unknown) {
	try {
		return tool.describe
			? await tool.describe(ctx, input)
			: { title: tool.label(input), detail: "" };
	} catch (error) {
		if (error instanceof ToolError) return { title: tool.label(input), detail: error.message };
		throw error;
	}
}

/** Runs one tool and stores its outcome; a write also shows a card with Undo. */
async function execute(
	deps: TurnDeps,
	messageId: string,
	tool: Tool,
	content: ToolContent,
	emit: Emit,
	changed: Set<string>,
): Promise<void> {
	const { ctx } = deps;
	await emit({ type: "step", callId: content.callId, label: content.label, status: "running" });
	try {
		const about = tool.effect === "read" ? null : await describe(tool, ctx, content.input);
		const outcome = await tool.run(ctx, content.input);
		const cards = [...content.cards, ...(outcome.cards ?? [])];
		if (about && outcome.undo?.length) {
			cards.push({
				kind: "change",
				callId: content.callId,
				title: about.title,
				detail: about.detail,
				undone: false,
			});
		}
		for (const card of cards.slice(content.cards.length)) await emit({ type: "card", card });
		for (const name of outcome.changed ?? []) changed.add(name);
		await deps.threads.updateTool(messageId, {
			...content,
			status: "done",
			result: JSON.stringify(outcome.result),
			cards,
			...(outcome.undo ? { undo: outcome.undo } : {}),
		});
		await emit({ type: "step", callId: content.callId, label: content.label, status: "done" });
	} catch (error) {
		if (!(error instanceof ToolError)) console.error(`[assistant] ${tool.name} failed`, error);
		const result =
			error instanceof ToolError
				? JSON.stringify({ error: error.message, ...(error.hint ? { hint: error.hint } : {}) })
				: JSON.stringify({
						error: "The tool failed. Tell the person it didn't work and to try again.",
					});
		await deps.threads.updateTool(messageId, { ...content, status: "failed", result });
		await emit({ type: "step", callId: content.callId, label: content.label, status: "failed" });
	}
}

/**
 * The person's answer to an approval. Once every pending approval in the turn is decided, the
 * pending calls run in order (declined ones tell the model so) and the turn carries on.
 */
export async function decide(
	deps: TurnDeps,
	callId: string,
	approve: boolean,
	emit: Emit,
): Promise<void> {
	const { threadId, threads } = deps;
	const stored = await threads.loadMessages(threadId);
	const pending = stored.filter(
		(message): message is Extract<StoredMessage, { role: "tool" }> =>
			message.role === "tool" &&
			(message.content.status === "pending" || message.content.status === "approved") &&
			message.content.result === null,
	);
	const target = pending.find((message) => message.content.callId === callId);
	if (!target || target.content.status !== "pending" || !target.content.needsApproval) {
		throw new AssistantError("nothing_to_approve");
	}
	const decided: ToolContent = {
		...target.content,
		status: approve ? "approved" : "declined",
		cards: target.content.cards.map((card) =>
			card.kind === "approval" && card.callId === callId
				? withState(card, approve ? "approved" : "declined")
				: card,
		),
	};
	await deps.threads.updateTool(target.id, decided);
	const decision = decided.cards.find((card) => card.kind === "approval");
	if (decision) await emit({ type: "card", card: decision });

	const after = pending.map((message) =>
		message.id === target.id ? Object.assign({}, message, { content: decided }) : message,
	);
	if (
		after.some((message) => message.content.needsApproval && message.content.status === "pending")
	) {
		await emit({ type: "done", changed: [], waiting: true });
		return;
	}

	const changed = new Set<string>();
	for (const message of after) {
		const tool = byName.get(message.content.name);
		if (message.content.status === "declined" || !tool) {
			await deps.threads.updateTool(message.id, {
				...message.content,
				status: "declined",
				result: JSON.stringify({
					declined: true,
					note: "The person said no. Don't retry; ask what they'd like instead.",
				}),
			});
			continue;
		}
		await execute(deps, message.id, tool, { ...message.content, status: "done" }, emit, changed);
	}
	await runTurnAfter(deps, emit, changed);
}

/** Carries the turn on after decisions, keeping what was already written. */
async function runTurnAfter(deps: TurnDeps, emit: Emit, changed: Set<string>) {
	await runTurn(deps, async (event) => {
		if (event.type === "done") {
			await emit({ ...event, changed: [...new Set([...changed, ...event.changed])] });
		} else {
			await emit(event);
		}
	});
}

/** Takes a change back: each record returns to how it was, or is removed if the change made it. */
export async function undo(
	ctx: ToolContext,
	threads: ThreadStore,
	callId: string,
	found: { id: string; content: ToolContent },
) {
	const { content } = found;
	if (!content.undo?.length || content.undone) throw new AssistantError("nothing_to_undo");
	const at = ctx.now.getTime();
	for (const write of content.undo) {
		if (write.previous === null) {
			const current = await ctx.store.get(write.collection, write.id, (raw) => raw);
			if (current !== null) await ctx.store.put(write.collection, write.id, current, at, true);
		} else {
			await ctx.store.put(write.collection, write.id, write.previous, at);
		}
	}
	const cards = content.cards.map((card) =>
		card.kind === "change" && card.callId === callId ? { ...card, undone: true } : card,
	);
	await threads.updateTool(found.id, { ...content, undone: true, cards });
	return {
		changed: [...new Set(content.undo.map((write) => write.collection))],
		card: cards.find((card) => card.kind === "change") ?? null,
	};
}

/** An approval card with its decision recorded. */
export function withState(
	card: Extract<Card, { kind: "approval" }>,
	state: "approved" | "declined",
): Card {
	return Object.assign({}, card, { state });
}

/** A new message moves on from changes left undecided: they count as declined. */
export async function expirePending(threads: ThreadStore, threadId: string): Promise<void> {
	const open = (await threads.loadMessages(threadId)).filter(
		(message) => message.role === "tool" && message.content.result === null,
	);
	await Promise.all(
		open.map((message) =>
			message.role === "tool"
				? threads.updateTool(message.id, {
						...message.content,
						status: "declined",
						result: JSON.stringify({
							declined: true,
							note: "The person moved on without deciding.",
						}),
						cards: message.content.cards.map((card) =>
							card.kind === "approval" ? withState(card, "declined") : card,
						),
					})
				: null,
		),
	);
}
