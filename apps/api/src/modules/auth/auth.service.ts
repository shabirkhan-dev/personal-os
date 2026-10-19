import type { Config } from "@/config/env";
import { messages } from "@/config/messages";
import { settings } from "@/config/settings";
import { AppError } from "@/core/app-error";
import type { Caller } from "@/core/context";
import type { Database } from "@/db/client";
import type { UserRow } from "@/db/schema";
import { hmacSha256, randomCode, safeEqual, sha256 } from "@/lib/crypto";
import { sendEmail } from "@/modules/email/email.service";
import { signInCodeEmail } from "@/modules/email/email.templates";
import { findOrCreateUser, findUserById } from "@/modules/users/users.repository";
import { toPublicUser } from "@/modules/users/users.service";
import * as repo from "./auth.repository";
import type { AuthSession, CodeSent } from "./auth.schema";
import { createRefreshToken, sessionIdOf, signAccessToken, verifyAccessToken } from "./auth.tokens";

type Deps = { db: Database; config: Config };

const codeHash = (config: Config, email: string, code: string) =>
	hmacSha256(config.auth.tokenSecret, `sign-in:${email}:${code}`);

const sessionExpiry = (now: number) => new Date(now + settings.auth.sessionTtlDays * 86_400_000);

/**
 * Sends a six-digit code. The answer is the same whether or not the email has an account; the
 * account is created when the code is used.
 */
export async function requestCode(
	{ db, config }: Deps,
	input: { email: string; name?: string | undefined },
	now = Date.now(),
): Promise<CodeSent> {
	const code = randomCode();
	await repo.saveCode(db, {
		email: input.email,
		displayName: input.name || null,
		codeHash: await codeHash(config, input.email, code),
		expiresAt: new Date(now + settings.auth.codeTtlMinutes * 60_000),
	});
	await sendEmail(
		config,
		input.email,
		signInCodeEmail(config.appName, code, settings.auth.codeTtlMinutes),
	);
	return {
		accepted: true,
		message: messages.SIGN_IN_CODE_SENT,
		...(config.auth.exposeCodes ? { developmentCode: code } : {}),
	};
}

export async function verifyCode(
	deps: Deps,
	input: { email: string; code: string },
	userAgent: string | null,
	now = Date.now(),
): Promise<AuthSession> {
	const { db, config } = deps;
	const saved = await repo.latestCode(db, input.email);
	if (
		!saved ||
		saved.expiresAt.getTime() <= now ||
		saved.attempts >= settings.auth.codeMaxAttempts
	) {
		throw new AppError("AUTH_CODE_INVALID");
	}
	if (!(await repo.claimAttempt(db, saved.id, settings.auth.codeMaxAttempts))) {
		throw new AppError("AUTH_CODE_INVALID");
	}
	if (!safeEqual(await codeHash(config, input.email, input.code), saved.codeHash)) {
		throw new AppError("AUTH_CODE_INVALID");
	}
	if (!(await repo.consumeCode(db, saved.id))) throw new AppError("AUTH_CODE_INVALID");

	const user = await findOrCreateUser(db, input.email, saved.displayName);
	if (!user.isActive) throw new AppError("AUTH_CODE_INVALID");
	return startSession(deps, user, userAgent, now);
}

/** Rotates the refresh token. A token that was already rotated away ends the session. */
export async function refresh(deps: Deps, refreshToken: string, now = Date.now()) {
	const { db } = deps;
	const sessionId = sessionIdOf(refreshToken);
	const session = sessionId ? await repo.findSession(db, sessionId) : null;
	if (!session || session.revokedAt || session.expiresAt.getTime() <= now) {
		throw new AppError("AUTH_REFRESH_TOKEN_INVALID");
	}
	const presented = await sha256(refreshToken);
	if (!safeEqual(presented, session.refreshTokenHash)) {
		await repo.revokeSession(db, session.id, "refresh_token_reuse");
		throw new AppError("AUTH_REFRESH_TOKEN_INVALID");
	}
	const user = await findUserById(db, session.userId);
	if (!user?.isActive) {
		await repo.revokeSession(db, session.id, "user_inactive");
		throw new AppError("AUTH_REFRESH_TOKEN_INVALID");
	}
	const next = createRefreshToken(session.id);
	const rotated = await repo.rotateSession(
		db,
		session.id,
		session.refreshTokenHash,
		await sha256(next),
		sessionExpiry(now),
	);
	if (!rotated) throw new AppError("AUTH_REFRESH_TOKEN_INVALID");
	return buildSession(deps, user, session.id, next, now);
}

/** Ends the session the token belongs to; an unknown or wrong token is ignored. */
export async function logout({ db }: Deps, refreshToken: string | undefined): Promise<void> {
	const sessionId = refreshToken ? sessionIdOf(refreshToken) : null;
	if (!refreshToken || !sessionId) return;
	const session = await repo.findSession(db, sessionId);
	if (session && safeEqual(await sha256(refreshToken), session.refreshTokenHash)) {
		await repo.revokeSession(db, session.id, "logout");
	}
}

/** The caller behind an access token, if its session is still live. */
export async function authenticate({ db, config }: Deps, accessToken: string): Promise<Caller> {
	const caller = await verifyAccessToken(config, accessToken);
	if (!(await repo.isSessionLive(db, caller.sessionId, caller.userId))) {
		throw new AppError("AUTH_SESSION_INVALID");
	}
	return caller;
}

async function startSession(
	deps: Deps,
	user: UserRow,
	userAgent: string | null,
	now: number,
): Promise<AuthSession> {
	const sessionId = crypto.randomUUID();
	const refreshToken = createRefreshToken(sessionId);
	await repo.createSession(deps.db, {
		id: sessionId,
		userId: user.id,
		refreshTokenHash: await sha256(refreshToken),
		userAgent: userAgent?.slice(0, 500) ?? null,
		expiresAt: sessionExpiry(now),
	});
	return buildSession(deps, user, sessionId, refreshToken, now);
}

async function buildSession(
	{ config }: Deps,
	user: UserRow,
	sessionId: string,
	refreshToken: string,
	now: number,
): Promise<AuthSession> {
	const access = await signAccessToken(config, { userId: user.id, sessionId }, now);
	return {
		accessToken: access.token,
		accessTokenExpiresAt: access.expiresAt.toISOString(),
		refreshToken,
		user: toPublicUser(config, user),
	};
}
