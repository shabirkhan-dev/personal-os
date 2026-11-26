import { Hono } from "hono";

import type { AppEnv } from "@/core/context";
import { ok } from "@/core/response";
import { SERVER_PACKS } from "./templates.packs";

/**
 * `GET /templates`: the template packs the server offers. Public and the same for everyone, so
 * phones and caches may keep it for an hour.
 */
export const templatesRoutes = new Hono<AppEnv>().get("/", (c) => {
	c.header("Cache-Control", "public, max-age=3600");
	return ok(c, { packs: SERVER_PACKS });
});
