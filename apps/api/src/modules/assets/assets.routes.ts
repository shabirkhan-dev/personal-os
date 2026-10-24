import { Hono } from "hono";

import type { AppEnv } from "@/core/context";
import { rateLimit } from "@/core/rate-limit";
import { ok } from "@/core/response";
import { validate } from "@/core/validate";
import { requireAuth } from "@/modules/auth/auth.middleware";
import { AppError } from "@/core/app-error";
import { confirmUploadSchema, createUploadSchema } from "./assets.schema";
import { assetUrl, confirmUpload, createUpload } from "./assets.service";

export const assetsRoutes = new Hono<AppEnv>()
	.use(requireAuth, rateLimit("UPLOAD_LIMITER"))
	.post("/uploads", validate("json", createUploadSchema), async (c) =>
		ok(c, await createUpload(c.get("config"), c.get("caller").userId, c.req.valid("json")), 201),
	)
	.post("/confirm", validate("json", confirmUploadSchema), async (c) => {
		const { kind, key } = c.req.valid("json");
		await confirmUpload(c.env.ASSETS, c.get("caller").userId, kind, key);
		const url = assetUrl(c.get("config"), key);
		if (!url) throw new AppError("ASSETS_UNAVAILABLE");
		return ok(c, { key, url });
	});
