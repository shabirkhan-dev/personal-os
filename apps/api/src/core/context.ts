import type { Context } from "hono";

import type { Config } from "@/config/env";
import type { Database, DatabaseHandle } from "@/db/client";

/** The authenticated caller, set by `requireAuth`. */
export type Caller = { userId: string; sessionId: string };

export type AppEnv = {
	Bindings: CloudflareBindings;
	Variables: {
		requestId: string;
		config: Config;
		/** Opens the database on first use in a request (see `dbOf`). */
		openDatabase: (config: Config, env: CloudflareBindings) => DatabaseHandle;
		database?: DatabaseHandle;
		caller: Caller;
	};
};

export type AppContext = Context<AppEnv>;

/** The request's database, opened on first use and closed when the response is done. */
export function dbOf(c: AppContext): Database {
	const existing = c.get("database");
	if (existing) return existing.db;
	const handle = c.get("openDatabase")(c.get("config"), c.env);
	c.set("database", handle);
	return handle.db;
}
