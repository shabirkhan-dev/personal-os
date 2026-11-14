import { loadConfig } from "@/config/env";
import { reportError } from "@/core/report-error";
import { cleanup } from "@/modules/maintenance/cleanup";
import { createApp, defaultOpenDatabase } from "./app";

const app = createApp();

/** The Worker. Requests run through the Hono app; the daily cron tidies old rows. */
export default {
	fetch: app.fetch,
	async scheduled(_controller, env, ctx) {
		const config = loadConfig(env);
		const handle = defaultOpenDatabase(config, env);
		ctx.waitUntil(
			cleanup(handle.db)
				.then((removed) => console.log("[cleanup]", JSON.stringify(removed)))
				.catch((error: unknown) => {
					console.error("[cleanup] failed", error);
					reportError(config, error, { tags: { job: "cleanup" } }, (promise) =>
						ctx.waitUntil(promise),
					);
				})
				.finally(() => handle.close()),
		);
	},
} satisfies ExportedHandler<CloudflareBindings>;
