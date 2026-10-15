import { createMiddleware } from "hono/factory";

import { AppError } from "@/core/app-error";
import { type AppEnv, dbOf } from "@/core/context";
import { authenticate } from "./auth.service";

/** Requires `Authorization: Bearer <access token>` for a live session; sets `caller`. */
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
	const header = c.req.header("authorization") ?? "";
	const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
	if (!token) throw new AppError("AUTH_REQUIRED");
	c.set("caller", await authenticate({ db: dbOf(c), config: c.get("config") }, token));
	await next();
});
