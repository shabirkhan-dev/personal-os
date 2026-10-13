import { ApiError } from "@/lib/api/client";
import type { AuthSession } from "../types/auth.types";

export type RestoreResult =
	| { status: "signed-out" }
	| { status: "signed-in"; session: AuthSession }
	| { status: "offline"; error: string };

export type RestoreDeps = {
	readToken: () => Promise<string | null>;
	refresh: (refreshToken: string) => Promise<AuthSession>;
	clearToken: () => Promise<void>;
	warn?: (message: string, detail: unknown) => void;
};

/** Statuses that mean the saved session is gone for good, so the token is dropped. */
const REJECTED = new Set([400, 401, 403, 404]);

/**
 * Restores the saved session on launch. Without a saved token it makes no request. A rejected
 * token is cleared; an unreachable API keeps the token and reports `offline` so the app can retry.
 */
export async function restoreSession({
	readToken,
	refresh,
	clearToken,
	warn = (message, detail) => console.warn(message, detail),
}: RestoreDeps): Promise<RestoreResult> {
	let token: string | null;
	try {
		token = await readToken();
	} catch (error) {
		warn("[auth] secure storage unavailable; starting signed out", error);
		return { status: "signed-out" };
	}
	if (!token) return { status: "signed-out" };

	try {
		return { status: "signed-in", session: await refresh(token) };
	} catch (error) {
		if (error instanceof ApiError && REJECTED.has(error.statusCode)) {
			await clearToken().catch((clearError: unknown) =>
				warn("[auth] could not clear the rejected session", clearError),
			);
			return { status: "signed-out" };
		}
		warn("[auth] could not restore the session", error);
		const message = error instanceof Error ? error.message : "Could not reach Personal OS";
		return { status: "offline", error: message };
	}
}
