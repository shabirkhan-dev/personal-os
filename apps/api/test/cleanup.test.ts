import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { aiUsage, sessions, signInCodes } from "@/db/schema";
import { cleanup } from "@/modules/maintenance/cleanup";
import { db, signIn, testApp } from "./support";

const { call } = testApp();
const DAY = 86_400_000;

describe("daily cleanup", () => {
	it("drops old codes, long-ended sessions and old AI usage, and keeps live ones", async () => {
		const live = await signIn(call);
		const ended = await signIn(call);
		const email = `old-${crypto.randomUUID()}@example.com`;
		await db.insert(signInCodes).values({
			email,
			codeHash: "0".repeat(64),
			expiresAt: new Date(Date.now() - 2 * DAY),
			createdAt: new Date(Date.now() - 2 * DAY),
		});
		await db
			.update(sessions)
			.set({ revokedAt: new Date(Date.now() - 8 * DAY) })
			.where(eq(sessions.userId, ended.user.id));
		await db.insert(aiUsage).values([
			{ userId: live.user.id, day: "2020-01-01", calls: 3 },
			{ userId: live.user.id, day: new Date().toISOString().slice(0, 10), calls: 1 },
		]);

		await cleanup(db);

		expect(await db.select().from(signInCodes).where(eq(signInCodes.email, email))).toEqual([]);
		expect(await db.select().from(sessions).where(eq(sessions.userId, ended.user.id))).toEqual([]);
		expect(await db.select().from(sessions).where(eq(sessions.userId, live.user.id))).toHaveLength(
			1,
		);
		expect(await db.select().from(aiUsage).where(eq(aiUsage.userId, live.user.id))).toHaveLength(1);
	});
});
