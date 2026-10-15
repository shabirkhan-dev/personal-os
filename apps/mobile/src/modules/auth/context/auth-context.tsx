import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import type { User } from "@/modules/users/types/user.types";
import { authService } from "../services/auth.service";
import { restoreSession } from "../services/restore-session";
import { tokenStorage } from "../services/token-storage";
import type {
	AuthChallengeResult,
	AuthSession,
	AuthStatus,
	EmailCodeRequest,
	EmailCodeVerify,
} from "../types/auth.types";

interface AuthContextValue {
	status: AuthStatus;
	token: string | null;
	user: User | null;
	/** Why the session could not be restored (only with `offline`). */
	error: string | null;
	requestEmailCode: (input: EmailCodeRequest) => Promise<AuthChallengeResult>;
	verifyEmailCode: (input: EmailCodeVerify) => Promise<void>;
	/** Retries restoring the saved session after `offline`. */
	retry: () => Promise<void>;
	logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [status, setStatus] = useState<AuthStatus>("loading");
	const [session, setSession] = useState<AuthSession | null>(null);
	const [error, setError] = useState<string | null>(null);

	const clearSession = useCallback(async () => {
		setSession(null);
		setStatus("signed-out");
		try {
			await tokenStorage.setRefreshToken(null);
		} catch (caught) {
			console.warn("[auth] could not clear the saved session", caught);
		}
	}, []);

	const establishSession = useCallback(async (next: AuthSession) => {
		try {
			await tokenStorage.setRefreshToken(next.refreshToken);
		} catch (caught) {
			// Still signed in for this run; the session just won't survive a restart.
			console.warn("[auth] could not save the session", caught);
		}
		setSession(next);
		setError(null);
		setStatus("signed-in");
	}, []);

	/** `quiet` keeps the current status while refreshing in the background. */
	const restore = useCallback(
		async (quiet = false) => {
			if (!quiet) setStatus("loading");
			const result = await restoreSession({
				readToken: tokenStorage.getRefreshToken,
				refresh: authService.refresh,
				clearToken: () => tokenStorage.setRefreshToken(null),
			});
			if (result.status === "signed-in") {
				await establishSession(result.session);
			} else if (result.status === "offline") {
				setError(result.error);
				setStatus("offline");
			} else {
				setStatus("signed-out");
			}
		},
		[establishSession],
	);

	useEffect(() => {
		restore().catch((caught: unknown) => {
			console.warn("[auth] session restore failed", caught);
			setStatus("signed-out");
		});
	}, [restore]);

	const tokenExpiresAt = session?.accessTokenExpiresAt ?? null;
	useEffect(() => {
		if (!tokenExpiresAt) return;
		const delay = Math.max(1_000, new Date(tokenExpiresAt).getTime() - Date.now() - 60_000);
		const timer = setTimeout(() => {
			restore(true).catch((caught: unknown) => console.warn("[auth] token refresh failed", caught));
		}, delay);
		return () => clearTimeout(timer);
	}, [restore, tokenExpiresAt]);

	const requestEmailCode = useCallback(
		(input: EmailCodeRequest) => authService.requestEmailCode(input),
		[],
	);

	const verifyEmailCode = useCallback(
		async (input: EmailCodeVerify) => {
			await establishSession(await authService.verifyEmailCode(input));
		},
		[establishSession],
	);

	const logout = useCallback(async () => {
		try {
			await authService.logout(await tokenStorage.getRefreshToken());
		} catch (caught) {
			// The local session is cleared either way; the server session expires on its own.
			console.warn("[auth] server logout failed", caught);
		} finally {
			await clearSession();
		}
	}, [clearSession]);

	const value = useMemo(
		() => ({
			status,
			token: session?.accessToken ?? null,
			user: session?.user ?? null,
			error,
			requestEmailCode,
			verifyEmailCode,
			retry: () => restore(),
			logout,
		}),
		[status, session, error, requestEmailCode, verifyEmailCode, restore, logout],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
	const context = useContext(AuthContext);
	if (!context) throw new Error("useAuth must be used inside AuthProvider");
	return context;
}
