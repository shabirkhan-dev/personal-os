import type { AssistantEvent } from "@personal-os/domain/assistant";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { streamSSE } from "hono/streaming";

import { settings } from "@/config/settings";
import { AppError } from "@/core/app-error";
import type { AppContext, AppEnv } from "@/core/context";
import { rateLimit } from "@/core/rate-limit";
import { ok } from "@/core/response";
import { validate } from "@/core/validate";
import { dbOf } from "@/core/context";
import { requireAuth } from "@/modules/auth/auth.middleware";
import { decide, runTurn, undo, withState } from "./assistant.agent";
import { threadTitle } from "./assistant.prompt";
import {
	addMessage,
	createThread,
	deleteMemory,
	deleteThread,
	findThread,
	findToolCall,
	listMemories,
	listThreads,
	loadMessages,
	toThreadMessages,
	updateTool,
} from "./assistant.repository";
import { approvalSchema, messageSchema, undoSchema } from "./assistant.schema";
import { safeZone } from "./assistant.time";
import type { ToolContext } from "./assistant.tool";

/**
 * The assistant, `/assistant`. A message or an approval answers as a stream of server-sent
 * events (`AssistantEvent`); the rest are plain JSON. Signed-in only.
 */
export const assistantRoutes = new Hono<AppEnv>()
	.use(
		requireAuth,
		bodyLimit({
			maxSize: settings.ai.maxBodyBytes,
			onError: () => {
				throw new AppError("BODY_TOO_LARGE");
			},
		}),
	)
	.post("/messages", rateLimit("AI_LIMITER"), validate("json", messageSchema), async (c) => {
		const body = c.req.valid("json");
		const userId = c.get("caller").userId;
		const context = { ...body.context, timeZone: safeZone(body.context.timeZone) };
		return stream(c, context, async (ctx, emit) => {
			let threadId = body.threadId;
			if (threadId) {
				if (!(await findThread(ctx.db, userId, threadId)))
					throw new AppError("ASSISTANT_THREAD_NOT_FOUND");
				await expirePending(ctx, threadId);
			} else {
				threadId = await createThread(ctx.db, userId, threadTitle(body.text));
			}
			await emit({ type: "thread", threadId, title: threadTitle(body.text) });
			await addMessage(ctx.db, threadId, { role: "user", content: { text: body.text, context } });
			await runTurn({ config: c.get("config"), ctx, threadId }, emit);
		});
	})
	.post("/approvals", rateLimit("AI_LIMITER"), validate("json", approvalSchema), async (c) => {
		const body = c.req.valid("json");
		const userId = c.get("caller").userId;
		const found = await findToolCall(dbOf(c), userId, body.callId);
		if (!found) throw new AppError("ASSISTANT_NOTHING_TO_APPROVE");
		const context = { timeZone: safeZone(body.timeZone) };
		return stream(c, context, (ctx, emit) =>
			decide(
				{ config: c.get("config"), ctx, threadId: found.threadId },
				body.callId,
				body.approve,
				emit,
			),
		);
	})
	.post("/undo", validate("json", undoSchema), async (c) => {
		const body = c.req.valid("json");
		const userId = c.get("caller").userId;
		const db = dbOf(c);
		const found = await findToolCall(db, userId, body.callId);
		if (!found) throw new AppError("ASSISTANT_NOTHING_TO_UNDO");
		const ctx: ToolContext = { db, userId, now: new Date(), context: { timeZone: "UTC" } };
		return ok(c, await undo(ctx, body.callId, found));
	})
	.get("/threads", async (c) => ok(c, await listThreads(dbOf(c), c.get("caller").userId)))
	.get("/threads/:id", async (c) => {
		const db = dbOf(c);
		const thread = await findThread(db, c.get("caller").userId, c.req.param("id"));
		if (!thread) throw new AppError("ASSISTANT_THREAD_NOT_FOUND");
		const messages = toThreadMessages(
			await loadMessages(db, thread.id),
			thread.createdAt.toISOString(),
		);
		return ok(c, { id: thread.id, title: thread.title, messages });
	})
	.delete("/threads/:id", async (c) => {
		if (!(await deleteThread(dbOf(c), c.get("caller").userId, c.req.param("id")))) {
			throw new AppError("ASSISTANT_THREAD_NOT_FOUND");
		}
		return c.body(null, 204);
	})
	.get("/memories", async (c) => ok(c, await listMemories(dbOf(c), c.get("caller").userId)))
	.delete("/memories/:id", async (c) => {
		if (!(await deleteMemory(dbOf(c), c.get("caller").userId, c.req.param("id")))) {
			throw new AppError("ASSISTANT_MEMORY_NOT_FOUND");
		}
		return c.body(null, 204);
	});

/**
 * Streams events from `work`. The stream outlives the request handler, so it opens its own
 * database connection and closes it when done. Known failures arrive as an `error` event.
 */
function stream(
	c: AppContext,
	context: ToolContext["context"],
	work: (ctx: ToolContext, emit: (event: AssistantEvent) => Promise<void>) => Promise<void>,
) {
	const userId = c.get("caller").userId;
	const handle = c.get("openDatabase")(c.get("config"), c.env);
	return streamSSE(c, async (sse) => {
		const emit = (event: AssistantEvent) => sse.writeSSE({ data: JSON.stringify(event) });
		try {
			await work({ db: handle.db, userId, now: new Date(), context }, emit);
		} catch (error) {
			if (!(error instanceof AppError)) console.error("[assistant] turn failed", error);
			const known = error instanceof AppError ? error : new AppError("INTERNAL_ERROR");
			await emit({ type: "error", code: known.code, message: known.message });
		} finally {
			await handle.close().catch((error: unknown) => console.warn("[assistant] closing db", error));
		}
	});
}

/** A new message moves on from changes left undecided: they count as declined. */
async function expirePending(ctx: ToolContext, threadId: string) {
	const open = (await loadMessages(ctx.db, threadId)).filter(
		(message) => message.role === "tool" && message.content.result === null,
	);
	await Promise.all(
		open.map((message) =>
			message.role === "tool"
				? updateTool(ctx.db, message.id, {
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
