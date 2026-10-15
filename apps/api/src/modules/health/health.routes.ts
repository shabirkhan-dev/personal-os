import { Hono } from "hono";

import { settings } from "@/config/settings";
import type { AppEnv } from "@/core/context";
import { ok } from "@/core/response";

export const healthRoutes = new Hono<AppEnv>().get("/health", (c) =>
	ok(c, {
		status: "ok" as const,
		service: settings.api.service,
		environment: c.get("config").environment,
		ai: c.get("config").ai.provider,
		assets: c.get("config").r2 ? "ready" : "not-configured",
	}),
);
