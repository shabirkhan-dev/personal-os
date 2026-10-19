import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { AppState } from "react-native";
import { onExpiredAccessToken } from "@/lib/api/client";
import { usersService } from "@/modules/users/services/users.service";
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
	/** Deletes the account on the server, then ends the session. Throws if the server refused. */
	deleteAccount: () => Promise<void>;
	/** Shows a changed account (new name or avatar) without signing in again. */
	updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [status, setStatus] = useState<AuthStatus>("loading");
	const [session, setSession] = useState<AuthSession | null>(null);
	const [error, setError] = useState<string | null>(null);
	/** The newest access token, readable right after a refresh (state updates later). */
	const accessToken = useRef<string | null>(null);

	const clearSession = useCallback(async () => {
		accessToken.current = null;
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
		accessToken.current = next.accessToken;
		setSession(next);
		setError(null);
		setStatus("signed-in");
	}, []);

	/**
	 * `quiet` keeps the current status while refreshing in the background. Calls made while one
	 * is running share it: two refreshes with the same token would look like token theft.
	 */
	const restoring = useRef<Promise<void> | null>(null);
	const restore = useCallback(
		(quiet = false) => {
			restoring.current ??= (async () => {
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
					accessToken.current = null;
					setStatus("signed-out");
				}
			})().finally(() => {
				restoring.current = null;
			});
			return restoring.current;
		},
		[establishSession],
	);

	// Requests rejected with an expired token wait for one refresh and retry with the new token.
	useEffect(
		() =>
			onExpiredAccessToken(async () => {
				await restore(true);
				return accessToken.current;
			}),
		[restore],
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
		// iOS pauses timers in the background: coming back with a token about to lapse refreshes it.
		const subscription = AppState.addEventListener("change", (state) => {
			if (state !== "active") return;
			if (new Date(tokenExpiresAt).getTime() - Date.now() > 120_000) return;
			restore(true).catch((caught: unknown) => console.warn("[auth] token refresh failed", caught));
		});
		return () => {
			clearTimeout(timer);
			subscription.remove();
		};
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

	const deleteAccount = useCallback(async () => {
		if (!session) throw new Error("Sign in to delete your account");
		await usersService.deleteAccount(session.accessToken);
		await clearSession();
	}, [session, clearSession]);

	const updateUser = useCallback((user: User) => {
		setSession((current) => (current ? { ...current, user } : current));
	}, []);

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
			deleteAccount,
			updateUser,
		}),
		[
			status,
			session,
			error,
			requestEmailCode,
			verifyEmailCode,
			restore,
			logout,
			deleteAccount,
			updateUser,
		],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
	const context = useContext(AuthContext);
	if (!context) throw new Error("useAuth must be used inside AuthProvider");
	return context;
}
