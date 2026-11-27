import { AI_TASKS, isAiTaskPath, runAiTask } from "@personal-os/ai";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";

import { settings } from "@/config/settings";
import { AppError } from "@/core/app-error";
import type { AppEnv } from "@/core/context";
import { rateLimit } from "@/core/rate-limit";
import { ok } from "@/core/response";
import { requireAuth } from "@/modules/auth/auth.middleware";
import { aiQuota } from "./ai.quota";

/**
 * Module AI, `POST /ai/<module>/<task>` for every task in `@personal-os/ai`. Signed-in only; the
 * provider key never leaves the API. People with their own key run the same tasks on the phone.
 */
export const aiRoutes = new Hono<AppEnv>()
	.use(
		requireAuth,
		rateLimit("AI_LIMITER"),
		aiQuota,
		bodyLimit({
			maxSize: settings.ai.maxBodyBytes,
			onError: () => {
				throw new AppError("BODY_TOO_LARGE");
			},
		}),
	)
	.post("/:module/:task", async (c) => {
		const path = `${c.req.param("module")}/${c.req.param("task")}`;
		if (!isAiTaskPath(path)) throw new AppError("NOT_FOUND");
		const body: unknown = await c.req.json().catch(() => null);
		const parsed = AI_TASKS[path].input.safeParse(body);
		if (!parsed.success) {
			throw new AppError("VALIDATION_FAILED", {
				issues: parsed.error.issues.map((issue) => ({
					path: issue.path.map(String).join("."),
					message: issue.message,
				})),
			});
		}
		return ok(c, await runAiTask(c.get("config").ai, path, parsed.data));
	});
