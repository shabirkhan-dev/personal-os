import type { User } from "@/modules/users/types/user.types";

export interface AuthSession {
	accessToken: string;
	accessTokenExpiresAt: string;
	/** Kept in SecureStore; rotates on every refresh. */
	refreshToken: string;
	user: User;
}

export interface AuthChallengeResult {
	accepted: true;
	message: string;
	/** Only outside production: the code, so local testing works without email. */
	developmentCode?: string;
}

export interface EmailCodeRequest {
	email: string;
	/** Used as the display name when the account is created. */
	name?: string;
}

export interface EmailCodeVerify {
	email: string;
	code: string;
}

/**
 * - `loading`: reading the saved session on launch
 * - `signed-out`: no session (never signed in, signed out, or the session expired)
 * - `signed-in`: a valid session
 * - `offline`: a session is saved but the API could not be reached to restore it
 */
export type AuthStatus = "loading" | "signed-out" | "signed-in" | "offline";
