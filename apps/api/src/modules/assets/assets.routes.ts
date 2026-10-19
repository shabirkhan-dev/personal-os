import { Hono } from "hono";

import type { AppEnv } from "@/core/context";
import { rateLimit } from "@/core/rate-limit";
import { ok } from "@/core/response";
import { validate } from "@/core/validate";
import { requireAuth } from "@/modules/auth/auth.middleware";
import { createUploadSchema } from "./assets.schema";
import { createUpload } from "./assets.service";

export const assetsRoutes = new Hono<AppEnv>()
	.use(requireAuth, rateLimit("UPLOAD_LIMITER"))
	.post("/uploads", validate("json", createUploadSchema), async (c) =>
		ok(c, await createUpload(c.get("config"), c.get("caller").userId, c.req.valid("json")), 201),
	);
