import * as z from "zod";

import type { PublicUser } from "@/modules/users/users.schema";

const email = z
	.email()
	.max(320)
	.transform((value) => value.trim().toLowerCase());

export const requestCodeSchema = z
	.object({ email, name: z.string().trim().max(100).optional() })
	.strict();

export const verifyCodeSchema = z
	.object({ email, code: z.string().regex(/^\d{6}$/, "Use the six-digit code") })
	.strict();

export const refreshSchema = z.object({ refreshToken: z.string().min(20).max(256) }).strict();

export const logoutSchema = z.object({ refreshToken: z.string().max(256).optional() }).strict();

export type CodeSent = {
	accepted: true;
	message: string;
	/** Only outside production without an email key, so local testing needs no inbox. */
	developmentCode?: string;
};

/** A signed-in session. The app keeps `refreshToken` in SecureStore. */
export type AuthSession = {
	accessToken: string;
	accessTokenExpiresAt: string;
	refreshToken: string;
	user: PublicUser;
};
