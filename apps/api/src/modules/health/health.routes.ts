import { sql } from "drizzle-orm";
import { Hono } from "hono";

import { settings } from "@/config/settings";
import { AppError } from "@/core/app-error";
import { type AppEnv, dbOf } from "@/core/context";
import { ok } from "@/core/response";

export const healthRoutes = new Hono<AppEnv>()
	.get("/health", (c) =>
		ok(c, {
			status: "ok" as const,
			service: settings.api.service,
			environment: c.get("config").environment,
			ai: c.get("config").ai.provider,
			assets: c.get("config").r2 ? "ready" : "not-configured",
		}),
	)
	/** Readiness for deploy checks and uptime monitors: the database answers a query. */
	.get("/ready", async (c) => {
		try {
			await dbOf(c).execute(sql`select 1`);
		} catch (error) {
			console.error("[ready] the database did not answer", error);
			throw new AppError("NOT_READY", { cause: error });
		}
		return ok(c, { status: "ready" as const });
	});
