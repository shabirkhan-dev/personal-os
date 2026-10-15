import { Hono } from "hono";

import { type AppEnv, dbOf } from "@/core/context";
import { rateLimit } from "@/core/rate-limit";
import { ok } from "@/core/response";
import { validate } from "@/core/validate";
import { requireAuth } from "@/modules/auth/auth.middleware";
import { syncRequestSchema } from "./sync.schema";
import { sync } from "./sync.service";

export const syncRoutes = new Hono<AppEnv>()
	.use(requireAuth, rateLimit("SYNC_LIMITER"))
	.post("/", validate("json", syncRequestSchema), async (c) =>
		ok(c, await sync(dbOf(c), c.get("caller").userId, c.req.valid("json"))),
	);
