import { loadConfig } from "@/config/env";
import { cleanup } from "@/modules/maintenance/cleanup";
import { createApp, defaultOpenDatabase } from "./app";

const app = createApp();

/** The Worker. Requests run through the Hono app; the daily cron tidies old rows. */
export default {
	fetch: app.fetch,
	async scheduled(_controller, env, ctx) {
		const handle = defaultOpenDatabase(loadConfig(env), env);
		ctx.waitUntil(
			cleanup(handle.db)
				.then((removed) => console.log("[cleanup]", JSON.stringify(removed)))
				.catch((error: unknown) => console.error("[cleanup] failed", error))
				.finally(() => handle.close()),
		);
	},
} satisfies ExportedHandler<CloudflareBindings>;
