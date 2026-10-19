import { createMiddleware } from "hono/factory";

import { AppError } from "./app-error";
import type { AppContext, AppEnv } from "./context";

type LimiterName = "AUTH_LIMITER" | "AI_LIMITER" | "SYNC_LIMITER" | "UPLOAD_LIMITER";

/**
 * Cloudflare's rate limiter, keyed by the signed-in user or else the client IP. Without the
 * binding (tests, scripts) requests pass.
 */
export function rateLimit(name: LimiterName) {
	return createMiddleware<AppEnv>(async (c, next) => {
		const limiter = c.env[name];
		if (limiter) {
			const { success } = await limiter.limit({ key: `${name}:${callerKey(c)}` });
			if (!success) throw new AppError("RATE_LIMITED");
		}
		await next();
	});
}

function callerKey(c: AppContext): string {
	return c.get("caller")?.userId ?? c.req.header("cf-connecting-ip") ?? "anonymous";
}
