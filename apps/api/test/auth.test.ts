import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { sessions, signInCodes, users } from "@/db/schema";
import { db, signIn, testApp } from "./support";

const { call } = testApp();
const newEmail = () => `Person-${crypto.randomUUID()}@Example.com`;

describe("email-code sign-in", () => {
	it("creates the account on first use, with the given name, and signs in", async () => {
		const email = newEmail();
		const sent = await call<{ data: { accepted: boolean; developmentCode: string } }>(
			"POST",
			"/auth/email-code/request",
			{ body: { email, name: "Shabir" } },
		);
		expect(sent.status).toBe(202);
		expect(sent.json?.data.developmentCode).toMatch(/^\d{6}$/);
		// No account until the code is used.
		expect(await db.select().from(users).where(eq(users.email, email.toLowerCase()))).toHaveLength(
			0,
		);

		const session = await call<{ data: { user: { email: string; displayName: string } } }>(
			"POST",
			"/auth/email-code/verify",
			{ body: { email, code: sent.json?.data.developmentCode } },
		);
		expect(session.status).toBe(200);
		expect(session.json?.data.user).toMatchObject({
			email: email.toLowerCase(),
			displayName: "Shabir",
		});
	});

	it("uses each code once and only the newest code", async () => {
		const email = newEmail();
		const first = await call<{ data: { developmentCode: string } }>(
			"POST",
			"/auth/email-code/request",
			{
				body: { email },
			},
		);
		// Past the one-a-minute cooldown.
		await db
			.update(signInCodes)
			.set({ createdAt: new Date(Date.now() - 120_000) })
			.where(eq(signInCodes.email, email.toLowerCase()));
		const second = await call<{ data: { developmentCode: string } }>(
			"POST",
			"/auth/email-code/request",
			{
				body: { email },
			},
		);
		const oldCode = first.json?.data.developmentCode;
		const newCode = second.json?.data.developmentCode;
		if (oldCode !== newCode) {
			const stale = await call("POST", "/auth/email-code/verify", {
				body: { email, code: oldCode },
			});
			expect(stale.status).toBe(401);
		}
		const ok = await call("POST", "/auth/email-code/verify", { body: { email, code: newCode } });
		expect(ok.status).toBe(200);
		const again = await call("POST", "/auth/email-code/verify", { body: { email, code: newCode } });
		expect(again.status).toBe(401);
		expect(again.json).toMatchObject({ success: false, code: "AUTH_CODE_INVALID" });
	});

	it("locks a code after five wrong tries", async () => {
		const email = newEmail();
		const sent = await call<{ data: { developmentCode: string } }>(
			"POST",
			"/auth/email-code/request",
			{
				body: { email },
			},
		);
		const code = sent.json?.data.developmentCode ?? "";
		const wrong = code === "123456" ? "654321" : "123456";
		for (let attempt = 0; attempt < 5; attempt += 1) {
			// oxlint-disable-next-line eslint/no-await-in-loop -- attempts are sequential
			await call("POST", "/auth/email-code/verify", { body: { email, code: wrong } });
		}
		const [row] = await db
			.select()
			.from(signInCodes)
			.where(eq(signInCodes.email, email.toLowerCase()));
		expect(row?.attempts).toBe(5);
		const right = await call("POST", "/auth/email-code/verify", { body: { email, code } });
		expect(right.status).toBe(401);
	});

	it("counts parallel guesses, so a burst can't get past five tries", async () => {
		const email = newEmail();
		const sent = await call<{ data: { developmentCode: string } }>(
			"POST",
			"/auth/email-code/request",
			{ body: { email } },
		);
		const code = sent.json?.data.developmentCode ?? "";
		const wrong = code === "123456" ? "654321" : "123456";
		const burst = await Promise.all(
			Array.from({ length: 20 }, () =>
				call("POST", "/auth/email-code/verify", { body: { email, code: wrong } }),
			),
		);
		expect(burst.every((response) => response.status === 401)).toBe(true);
		const [row] = await db
			.select()
			.from(signInCodes)
			.where(eq(signInCodes.email, email.toLowerCase()));
		expect(row?.attempts).toBe(5);
		const right = await call("POST", "/auth/email-code/verify", { body: { email, code } });
		expect(right.status).toBe(401);
	});

	it("sends one code a minute and ten a day per email, whatever the IP", async () => {
		const email = newEmail();
		const first = await call("POST", "/auth/email-code/request", { body: { email } });
		expect(first.status).toBe(202);
		const again = await call("POST", "/auth/email-code/request", { body: { email } });
		expect(again.status).toBe(429);
		expect(again.json).toMatchObject({ success: false, code: "RATE_LIMITED" });

		// Past the cooldown, but with nine more codes earlier today: ten in a day is the cap.
		const lower = email.toLowerCase();
		await db
			.update(signInCodes)
			.set({ createdAt: new Date(Date.now() - 120_000) })
			.where(eq(signInCodes.email, lower));
		await db.insert(signInCodes).values(
			Array.from({ length: 9 }, (_, index) => ({
				email: lower,
				codeHash: "0".repeat(64),
				expiresAt: new Date(),
				createdAt: new Date(Date.now() - (index + 2) * 3_600_000),
			})),
		);
		const capped = await call("POST", "/auth/email-code/request", { body: { email } });
		expect(capped.status).toBe(429);
	});

	it("rejects a malformed body with the issues", async () => {
		const response = await call("POST", "/auth/email-code/verify", {
			body: { email: "nope", code: "12" },
		});
		expect(response.status).toBe(400);
		expect(response.json).toMatchObject({
			success: false,
			code: "VALIDATION_FAILED",
			errors: expect.arrayContaining([expect.objectContaining({ path: "email" })]),
		});
	});
});

describe("sessions", () => {
	it("rotates the refresh token and ends the session when an old one is reused", async () => {
		const session = await signIn(call);
		const rotated = await call<{ data: { refreshToken: string; accessToken: string } }>(
			"POST",
			"/auth/refresh",
			{ body: { refreshToken: session.refreshToken } },
		);
		expect(rotated.status).toBe(200);
		const next = rotated.json?.data.refreshToken ?? "";
		expect(next).not.toBe(session.refreshToken);

		// The old token again after the grace window: treated as stolen, so the whole session ends.
		await db
			.update(sessions)
			.set({ rotatedAt: new Date(Date.now() - 120_000) })
			.where(eq(sessions.userId, session.user.id));
		const reused = await call("POST", "/auth/refresh", {
			body: { refreshToken: session.refreshToken },
		});
		expect(reused.status).toBe(401);
		const afterTheft = await call("POST", "/auth/refresh", { body: { refreshToken: next } });
		expect(afterTheft.status).toBe(401);
		const me = await call("GET", "/users/me", { token: rotated.json?.data.accessToken });
		expect(me.status).toBe(401);
	});

	it("accepts a retry with the just-rotated token, as when the first answer was lost", async () => {
		const session = await signIn(call);
		const lost = await call("POST", "/auth/refresh", {
			body: { refreshToken: session.refreshToken },
		});
		expect(lost.status).toBe(200);
		const retried = await call<{ data: { refreshToken: string; accessToken: string } }>(
			"POST",
			"/auth/refresh",
			{ body: { refreshToken: session.refreshToken } },
		);
		expect(retried.status).toBe(200);
		const me = await call("GET", "/users/me", { token: retried.json?.data.accessToken });
		expect(me.status).toBe(200);
		const onward = await call("POST", "/auth/refresh", {
			body: { refreshToken: retried.json?.data.refreshToken },
		});
		expect(onward.status).toBe(200);
	});

	it("serves /users/me with a live session and stops after logout", async () => {
		const session = await signIn(call);
		const me = await call<{ data: { id: string; avatarUrl: null } }>("GET", "/users/me", {
			token: session.accessToken,
		});
		expect(me.status).toBe(200);
		expect(me.json?.data).toMatchObject({ id: session.user.id, avatarUrl: null });

		const out = await call("POST", "/auth/logout", {
			body: { refreshToken: session.refreshToken },
		});
		expect(out.status).toBe(204);
		expect((await call("GET", "/users/me", { token: session.accessToken })).status).toBe(401);
		expect(
			(await call("POST", "/auth/refresh", { body: { refreshToken: session.refreshToken } }))
				.status,
		).toBe(401);
	});

	it("answers missing or bad tokens with the standard envelope", async () => {
		const missing = await call("GET", "/users/me");
		expect(missing.json).toMatchObject({ success: false, statusCode: 401, code: "AUTH_REQUIRED" });
		const bad = await call("GET", "/users/me", { token: "not-a-jwt" });
		expect(bad.json).toMatchObject({ code: "AUTH_ACCESS_TOKEN_INVALID", path: "/api/v1/users/me" });
		expect(bad.json?.requestId).toMatch(/^req_/);
	});
});
