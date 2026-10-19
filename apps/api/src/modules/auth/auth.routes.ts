import { Hono } from "hono";

import { type AppContext, type AppEnv, dbOf } from "@/core/context";
import { rateLimit } from "@/core/rate-limit";
import { noContent, ok } from "@/core/response";
import { validate } from "@/core/validate";
import { logoutSchema, refreshSchema, requestCodeSchema, verifyCodeSchema } from "./auth.schema";
import { logout, refresh, requestCode, verifyCode } from "./auth.service";

const deps = (c: AppContext) => ({ db: dbOf(c), config: c.get("config") });

/**
 * The IP limiter only guards the email-code routes. Refresh and logout carry a session token, and
 * many phones can share one carrier IP; limiting them by IP would sign people out.
 */
export const authRoutes = new Hono<AppEnv>()
	.post(
		"/email-code/request",
		rateLimit("AUTH_LIMITER"),
		validate("json", requestCodeSchema),
		async (c) => ok(c, await requestCode(deps(c), c.req.valid("json")), 202),
	)
	.post(
		"/email-code/verify",
		rateLimit("AUTH_LIMITER"),
		validate("json", verifyCodeSchema),
		async (c) =>
			ok(c, await verifyCode(deps(c), c.req.valid("json"), c.req.header("user-agent") ?? null)),
	)
	.post("/refresh", validate("json", refreshSchema), async (c) =>
		ok(c, await refresh(deps(c), c.req.valid("json").refreshToken)),
	)
	.post("/logout", validate("json", logoutSchema), async (c) => {
		await logout(deps(c), c.req.valid("json").refreshToken);
		return noContent(c);
	});
