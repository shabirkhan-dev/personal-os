import { jwtVerify, SignJWT } from "jose";

import type { Config } from "@/config/env";
import { settings } from "@/config/settings";
import { AppError } from "@/core/app-error";
import type { Caller } from "@/core/context";
import { randomToken } from "@/lib/crypto";

/** A short-lived HS256 JWT naming the user (`sub`) and session (`sid`). */
export async function signAccessToken(config: Config, caller: Caller, now = Date.now()) {
	const expiresAt = new Date(now + settings.auth.accessTokenTtlMs);
	const token = await new SignJWT({ sid: caller.sessionId })
		.setProtectedHeader({ alg: "HS256", typ: "JWT" })
		.setSubject(caller.userId)
		.setIssuedAt(Math.floor(now / 1000))
		.setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
		.sign(config.auth.jwtSecret);
	return { token, expiresAt };
}

export async function verifyAccessToken(config: Config, token: string): Promise<Caller> {
	try {
		const { payload } = await jwtVerify(token, config.auth.jwtSecret, { algorithms: ["HS256"] });
		if (typeof payload.sub !== "string" || typeof payload.sid !== "string") {
			throw new Error("missing claims");
		}
		return { userId: payload.sub, sessionId: payload.sid };
	} catch (error) {
		throw new AppError("AUTH_ACCESS_TOKEN_INVALID", { cause: error });
	}
}

/** `<session id>.<secret>`: the id finds the row, the secret is checked against its hash. */
export function createRefreshToken(sessionId: string): string {
	return `${sessionId}.${randomToken(48)}`;
}

export function sessionIdOf(refreshToken: string): string | null {
	const [sessionId, secret, ...rest] = refreshToken.split(".");
	const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
	return sessionId && secret && rest.length === 0 && uuid.test(sessionId) ? sessionId : null;
}
