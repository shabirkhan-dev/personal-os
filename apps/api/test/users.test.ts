import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { syncRecords, users } from "@/db/schema";
import { db, memoryBucket, signIn, testApp, testEnv } from "./support";

const bucket = memoryBucket();
const { call } = testApp(testEnv({ ASSETS: bucket }));

type Ticket = { key: string; uploadUrl: string; headers: Record<string, string> };

async function ticket(token: string, contentType = "image/jpeg") {
	return call<{ data: Ticket }>("POST", "/assets/uploads", {
		token,
		body: { kind: "avatar", contentType, size: 120_000 },
	});
}

describe("avatar straight to R2", () => {
	it("hands out a presigned PUT under the caller's prefix", async () => {
		const session = await signIn(call);
		const response = await ticket(session.accessToken, "image/png");
		expect(response.status).toBe(201);
		const data = response.json?.data;
		expect(data?.key).toMatch(new RegExp(`^avatars/${session.user.id}/[0-9a-f-]{36}\\.png$`));
		const url = new URL(data?.uploadUrl ?? "");
		expect(url.host).toBe("account123.r2.cloudflarestorage.com");
		expect(url.pathname).toBe(`/personal-os-assets/${data?.key}`);
		expect(url.searchParams.get("X-Amz-Signature")).toMatch(/^[0-9a-f]{64}$/);
		expect(url.searchParams.get("X-Amz-SignedHeaders")).toContain("content-type");
		expect(url.searchParams.get("X-Amz-SignedHeaders")).toContain("content-length");
		expect(data?.headers).toEqual({ "Content-Type": "image/png", "Content-Length": "120000" });
	});

	it("refuses a ticket for a file over the size limit", async () => {
		const session = await signIn(call);
		const response = await call("POST", "/assets/uploads", {
			token: session.accessToken,
			body: { kind: "avatar", contentType: "image/jpeg", size: 6 * 1024 * 1024 },
		});
		expect(response.status).toBe(400);
		expect(response.json).toMatchObject({ code: "VALIDATION_FAILED" });
	});

	it("saves the key only once the file is in the bucket", async () => {
		const session = await signIn(call);
		const { key } = (await ticket(session.accessToken)).json?.data ?? { key: "" };

		const early = await call("PATCH", "/users/me/profile", {
			token: session.accessToken,
			body: { avatarKey: key },
		});
		expect(early.json).toMatchObject({ code: "ASSET_NOT_UPLOADED" });

		bucket.put(key, 120_000, "image/jpeg");
		const saved = await call<{ data: { avatarUrl: string } }>("PATCH", "/users/me/profile", {
			token: session.accessToken,
			body: { avatarKey: key },
		});
		expect(saved.status).toBe(200);
		expect(saved.json?.data.avatarUrl).toBe(`https://assets.example.com/${key}`);
	});

	it("deletes an oversized or wrongly typed file and refuses it", async () => {
		const session = await signIn(call);
		const { key } = (await ticket(session.accessToken)).json?.data ?? { key: "" };
		bucket.put(key, 9 * 1024 * 1024, "image/jpeg");
		const response = await call("PATCH", "/users/me/profile", {
			token: session.accessToken,
			body: { avatarKey: key },
		});
		expect(response.json).toMatchObject({ code: "ASSET_INVALID" });
		expect(bucket.objects.has(key)).toBe(false);
	});

	it("refuses another user's key and removes the old avatar on replace", async () => {
		const owner = await signIn(call);
		const other = await signIn(call);
		const first = (await ticket(owner.accessToken)).json?.data.key ?? "";
		bucket.put(first, 1000, "image/jpeg");

		const stolen = await call("PATCH", "/users/me/profile", {
			token: other.accessToken,
			body: { avatarKey: first },
		});
		expect(stolen.json).toMatchObject({ code: "ASSET_INVALID" });

		await call("PATCH", "/users/me/profile", {
			token: owner.accessToken,
			body: { avatarKey: first },
		});
		const second = (await ticket(owner.accessToken, "image/webp")).json?.data.key ?? "";
		bucket.put(second, 1000, "image/webp");
		await call("PATCH", "/users/me/profile", {
			token: owner.accessToken,
			body: { avatarKey: second },
		});
		expect(bucket.objects.has(first)).toBe(false);
		expect(bucket.objects.has(second)).toBe(true);
	});

	it("updates the display name and refuses unknown types", async () => {
		const session = await signIn(call);
		const named = await call<{ data: { displayName: string } }>("PATCH", "/users/me/profile", {
			token: session.accessToken,
			body: { displayName: "  Shabir Khan " },
		});
		expect(named.json?.data.displayName).toBe("Shabir Khan");
		const gif = await ticket(session.accessToken, "image/gif");
		expect(gif.json).toMatchObject({ code: "VALIDATION_FAILED" });
	});

	it("answers 503 when R2 is not configured", async () => {
		const bare = testApp(testEnv({ R2_ACCESS_KEY_ID: "" }));
		const session = await signIn(bare.call);
		const response = await bare.call("POST", "/assets/uploads", {
			token: session.accessToken,
			body: { kind: "avatar", contentType: "image/jpeg", size: 120_000 },
		});
		expect(response.status).toBe(503);
		expect(response.json).toMatchObject({ code: "ASSETS_UNAVAILABLE" });
	});
});

describe("DELETE /users/me", () => {
	it("deletes the account, its data and its files, and ends every session", async () => {
		const session = await signIn(call);
		const { key } = (await ticket(session.accessToken)).json?.data ?? { key: "" };
		bucket.put(key, 2048, "image/jpeg");
		await call("PATCH", "/users/me/profile", {
			token: session.accessToken,
			body: { avatarKey: key },
		});
		bucket.put(
			`avatars/${session.user.id}/00000000-0000-0000-0000-000000000000.jpg`,
			10,
			"image/jpeg",
		);
		await call("POST", "/sync", {
			token: session.accessToken,
			body: {
				cursor: null,
				changes: [
					{ collection: "finance-entries", id: "e1", data: {}, updatedAt: 1, deletedAt: null },
				],
			},
		});

		const gone = await call("DELETE", "/users/me", { token: session.accessToken });
		expect(gone.status).toBe(204);
		expect([...bucket.objects.keys()].some((k) => k.includes(session.user.id))).toBe(false);
		expect((await call("GET", "/users/me", { token: session.accessToken })).status).toBe(401);
		expect(
			(await call("POST", "/auth/refresh", { body: { refreshToken: session.refreshToken } }))
				.status,
		).toBe(401);
		expect(
			await db.select().from(syncRecords).where(eq(syncRecords.userId, session.user.id)),
		).toEqual([]);
		expect(await db.select().from(users).where(eq(users.id, session.user.id))).toEqual([]);
	});
});
