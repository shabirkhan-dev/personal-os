import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";

import { type Config, ConfigError, loadConfig } from "@/config/env";
import { settings } from "@/config/settings";
import { AppError } from "@/core/app-error";
import type { AppEnv } from "@/core/context";
import { onError, onNotFound } from "@/core/error-handler";
import { type DatabaseHandle, openDatabase } from "@/db/client";
import { aiRoutes } from "@/modules/ai/ai.routes";
import { assistantRoutes } from "@/modules/assistant/assistant.routes";
import { assetsRoutes } from "@/modules/assets/assets.routes";
import { authRoutes } from "@/modules/auth/auth.routes";
import { healthRoutes } from "@/modules/health/health.routes";
import { onboardingRoutes } from "@/modules/onboarding/onboarding.routes";
import { syncRoutes } from "@/modules/sync/sync.routes";
import { usersRoutes } from "@/modules/users/users.routes";

export type AppOptions = {
	/** How a request opens the database; tests pass a shared test database. */
	openDatabase?: (config: Config, env: CloudflareBindings) => DatabaseHandle;
};

/** On Workers the URL is Hyperdrive's; elsewhere (scripts) it is DATABASE_URL. */
export function defaultOpenDatabase(config: Config, env: CloudflareBindings): DatabaseHandle {
	const url = env.HYPERDRIVE?.connectionString ?? config.databaseUrl;
	if (!url) throw new Error("No database: bind HYPERDRIVE or set DATABASE_URL");
	return openDatabase(url);
}

export function createApp(options: AppOptions = {}) {
	const open = options.openDatabase ?? defaultOpenDatabase;

	const api = new Hono<AppEnv>()
		.route("/", healthRoutes)
		.route("/auth", authRoutes)
		.route("/users/me/onboarding", onboardingRoutes)
		.route("/users", usersRoutes)
		.route("/assets", assetsRoutes)
		.route("/sync", syncRoutes)
		.route("/ai", aiRoutes)
		.route("/assistant", assistantRoutes);

	const app = new Hono<AppEnv>()
		.use(requestId({ generator: () => `req_${crypto.randomUUID()}` }))
		.use(secureHeaders())
		.use(async (c, next) => {
			try {
				c.set("config", loadConfig(c.env));
			} catch (error) {
				if (!(error instanceof ConfigError)) throw error;
				console.error("[config]", error.message);
				throw new AppError("CONFIG_INVALID", { cause: error });
			}
			c.set("openDatabase", open);
			try {
				await next();
			} finally {
				const handle = c.get("database");
				if (handle) {
					const closing = handle.close().catch((error: unknown) => {
						console.warn("[db] closing the connection failed", error);
					});
					try {
						c.executionCtx.waitUntil(closing);
					} catch {
						await closing;
					}
				}
			}
		})
		.use(
			bodyLimit({
				maxSize: settings.maxBodyBytes,
				onError: () => {
					throw new AppError("BODY_TOO_LARGE");
				},
			}),
		)
		.route(settings.api.prefix, api);

	app.onError(onError);
	app.notFound(onNotFound);
	return app;
}

export type App = ReturnType<typeof createApp>;
