import {
	AiError,
	AssistantError,
	decide,
	expirePending,
	runTurn,
	safeZone,
	type ThreadStore,
	threadTitle,
	type ToolContext,
	toThreadMessages,
	undo,
} from "@personal-os/ai";
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
import { countCall } from "@/modules/ai/ai.quota";
import { requireAuth } from "@/modules/auth/auth.middleware";
import {
	createThread,
	deleteMemory,
	deleteThread,
	findThread,
	findToolCall,
	listMemories,
	listThreads,
	loadMessages,
} from "./assistant.repository";
import { approvalSchema, messageSchema, undoSchema } from "./assistant.schema";
import { serverStores } from "./assistant.store";

/** The agent's own failures as API errors. */
function asAppError(error: unknown): AppError | null {
	if (error instanceof AppError) return error;
	if (error instanceof AssistantError) {
		return new AppError(
			error.code === "nothing_to_approve"
				? "ASSISTANT_NOTHING_TO_APPROVE"
				: "ASSISTANT_NOTHING_TO_UNDO",
		);
	}
	if (error instanceof AiError) {
		return new AppError(error.code === "invalid_output" ? "AI_INVALID_OUTPUT" : "AI_UNAVAILABLE");
	}
	return null;
}

type Work = {
	ctx: ToolContext;
	threads: ThreadStore;
	db: Parameters<typeof serverStores>[0];
	/** Counts a model call against the person's daily allowance. */
	beforeCall: () => Promise<void>;
};

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
		return stream(c, context, async ({ ctx, threads, db, beforeCall }, emit) => {
			let threadId = body.threadId;
			if (threadId) {
				if (!(await findThread(db, userId, threadId)))
					throw new AppError("ASSISTANT_THREAD_NOT_FOUND");
				await expirePending(threads, threadId);
			} else {
				threadId = await createThread(db, userId, threadTitle(body.text));
			}
			await emit({ type: "thread", threadId, title: threadTitle(body.text) });
			await threads.addMessage(threadId, { role: "user", content: { text: body.text, context } });
			await runTurn({ config: c.get("config").ai, ctx, threadId, threads, beforeCall }, emit);
		});
	})
	.post("/approvals", rateLimit("AI_LIMITER"), validate("json", approvalSchema), async (c) => {
		const body = c.req.valid("json");
		const userId = c.get("caller").userId;
		const found = await findToolCall(dbOf(c), userId, body.callId);
		if (!found) throw new AppError("ASSISTANT_NOTHING_TO_APPROVE");
		const context = { timeZone: safeZone(body.timeZone) };
		return stream(c, context, ({ ctx, threads, beforeCall }, emit) =>
			decide(
				{ config: c.get("config").ai, ctx, threadId: found.threadId, threads, beforeCall },
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
		const { store, threads } = serverStores(db, userId);
		const ctx: ToolContext = { store, now: new Date(), context: { timeZone: "UTC" } };
		try {
			return ok(c, await undo(ctx, threads, body.callId, found));
		} catch (error) {
			throw asAppError(error) ?? error;
		}
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
	work: (work: Work, emit: (event: AssistantEvent) => Promise<void>) => Promise<void>,
) {
	const userId = c.get("caller").userId;
	const config = c.get("config");
	const handle = c.get("openDatabase")(config, c.env);
	return streamSSE(c, async (sse) => {
		const emit = (event: AssistantEvent) => sse.writeSSE({ data: JSON.stringify(event) });
		const now = new Date();
		const { store, threads } = serverStores(handle.db, userId);
		const beforeCall = async () => {
			if ((await countCall(handle.db, userId, now)) > settings.ai.callsPerDay) {
				throw new AppError("AI_QUOTA_REACHED");
			}
		};
		try {
			await work({ ctx: { store, now, context }, threads, db: handle.db, beforeCall }, emit);
		} catch (error) {
			const mapped = asAppError(error);
			if (!mapped) console.error("[assistant] turn failed", error);
			const known = mapped ?? new AppError("INTERNAL_ERROR");
			await emit({ type: "error", code: known.code, message: known.message });
		} finally {
			await handle.close().catch((error: unknown) => console.warn("[assistant] closing db", error));
		}
	});
}
