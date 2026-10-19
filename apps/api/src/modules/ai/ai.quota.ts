import { sql } from "drizzle-orm";
import { createMiddleware } from "hono/factory";

import { settings } from "@/config/settings";
import { AppError } from "@/core/app-error";
import { type AppEnv, dbOf } from "@/core/context";
import type { Database } from "@/db/client";
import { aiUsage } from "@/db/schema";

/** Counts one AI call for the user today and returns the new total, in one statement. */
export async function countCall(db: Database, userId: string, now = new Date()): Promise<number> {
	const day = now.toISOString().slice(0, 10);
	const [row] = await db
		.insert(aiUsage)
		.values({ userId, day, calls: 1 })
		.onConflictDoUpdate({
			target: [aiUsage.userId, aiUsage.day],
			set: { calls: sql`${aiUsage.calls} + 1` },
		})
		.returning({ calls: aiUsage.calls });
	return row?.calls ?? 1;
}

/** Refuses AI calls past the daily allowance. Runs after `requireAuth`. */
export const aiQuota = createMiddleware<AppEnv>(async (c, next) => {
	const calls = await countCall(dbOf(c), c.get("caller").userId);
	if (calls > settings.ai.callsPerDay) throw new AppError("AI_QUOTA_REACHED");
	await next();
});
