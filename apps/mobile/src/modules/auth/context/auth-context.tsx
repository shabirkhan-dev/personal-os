import { useQueryClient } from "@tanstack/react-query";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { AppState } from "react-native";
import { ApiError, setAccessTokenRefresher } from "@/lib/api/client";
import { usersService } from "@/modules/users/services/users.service";
import type { User } from "@/modules/users/types/user.types";
import { authService } from "../services/auth.service";
import { tokenStorage } from "../services/token-storage";
import type {
	AuthSession,
	LoginInput,
	LoginResult,
	RegisterInput,
	RegistrationResult,
	TwoFactorInput,
} from "../types/auth.types";

interface AuthContextValue {
	token: string | null;
	user: User | null;
	loading: boolean;
	error: string | null;
	login: (input: LoginInput) => Promise<LoginResult>;
	verifyTwoFactor: (input: TwoFactorInput) => Promise<void>;
	register: (input: RegisterInput) => Promise<RegistrationResult>;
	consumeMagicLink: (token: string) => Promise<void>;
	establishSession: (session: AuthSession) => Promise<void>;
	logout: () => Promise<void>;
	logoutAll: () => Promise<void>;
	refreshUser: () => Promise<void>;
	clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const queryClient = useQueryClient();
	// The backend rotates refresh tokens and revokes sessions on reuse, so all
	// triggers (bootstrap, timer, foreground resume, 401 retry) must share one
	// in-flight network refresh for the current provider session.
	const sessionGenerationRef = useRef(0);
	const inFlightRefreshRef = useRef<Promise<AuthSession | null> | null>(null);
	// Tracked with a ref so identity comparisons never appear in effect
	// dependency lists and cannot retrigger the bootstrap refresh loop.
	const previousUserIdRef = useRef<string | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [tokenExpiresAt, setTokenExpiresAt] = useState<string | null>(null);
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Cached query data is user-scoped and sensitive: dropping the tokens alone
	// would leave the previous account's rows readable until refetch. Cancel
	// in-flight requests first so aborted responses never repopulate the cache.
	const purgeAuthenticatedCaches = useCallback(() => {
		queryClient.cancelQueries();
		queryClient.clear();
	}, [queryClient]);

	const clearSession = useCallback(async () => {
		sessionGenerationRef.current += 1;
		inFlightRefreshRef.current = null;
		setToken(null);
		setTokenExpiresAt(null);
		setUser(null);
		purgeAuthenticatedCaches();
		await tokenStorage.setRefreshToken(null);
	}, [purgeAuthenticatedCaches]);

	const establishSession = useCallback(
		async (session: AuthSession, expectedGeneration?: number) => {
			const generation = expectedGeneration ?? sessionGenerationRef.current + 1;
			if (expectedGeneration === undefined) sessionGenerationRef.current = generation;
			if (generation !== sessionGenerationRef.current) return false;

			const nextUserId = session.user.id;
			if (previousUserIdRef.current && previousUserIdRef.current !== nextUserId) {
				// Account switch without an intervening logout: drop the previous
				// account's data before the new identity becomes visible.
				purgeAuthenticatedCaches();
			}
			setToken(session.accessToken);
			setTokenExpiresAt(session.accessTokenExpiresAt);
			setUser(session.user);
			previousUserIdRef.current = nextUserId;
			if (session.refreshToken) {
				await tokenStorage.setRefreshToken(session.refreshToken);
			}
			if (generation !== sessionGenerationRef.current) return false;
			// Auth session payloads omit profile; hydrate from /users/me like web.
			try {
				const profile = await usersService.getCurrent(session.accessToken);
				if (generation === sessionGenerationRef.current) setUser(profile);
			} catch {
				// Keep session.user if profile fetch fails (offline, transient errors).
			}
			return generation === sessionGenerationRef.current;
		},
		[purgeAuthenticatedCaches],
	);

	const refreshSession = useCallback(() => {
		if (inFlightRefreshRef.current) return inFlightRefreshRef.current;
		const generation = sessionGenerationRef.current;
		let refreshPromise: Promise<AuthSession | null>;
		refreshPromise = authService
			.refresh()
			.then(async (session) => {
				if (generation !== sessionGenerationRef.current) return null;
				return (await establishSession(session, generation)) ? session : null;
			})
			.finally(() => {
				if (inFlightRefreshRef.current === refreshPromise) {
					inFlightRefreshRef.current = null;
				}
			});
		inFlightRefreshRef.current = refreshPromise;
		return refreshPromise;
	}, [establishSession]);

	useEffect(() => {
		const generation = sessionGenerationRef.current;
		refreshSession()
			.catch(() => {
				if (generation === sessionGenerationRef.current) return clearSession();
			})
			.finally(() => setLoading(false));
	}, [clearSession, refreshSession]);

	useEffect(() => {
		if (!tokenExpiresAt) return;
		const generation = sessionGenerationRef.current;
		const delay = Math.max(1_000, new Date(tokenExpiresAt).getTime() - Date.now() - 60_000);
		const timer = setTimeout(() => {
			refreshSession().catch(() => {
				if (generation === sessionGenerationRef.current) void clearSession();
			});
		}, delay);
		return () => clearTimeout(timer);
	}, [clearSession, refreshSession, tokenExpiresAt]);

	// Revalidate on foreground resume: after sleep or connectivity loss the
	// access token is often expired even though a valid refresh token remains.
	useEffect(() => {
		const subscription = AppState.addEventListener("change", (state) => {
			if (state !== "active" || !token) return;
			const expiresAtMs = tokenExpiresAt ? new Date(tokenExpiresAt).getTime() : 0;
			if (Date.now() >= expiresAtMs - 60_000) {
				const generation = sessionGenerationRef.current;
				refreshSession().catch(() => {
					if (generation === sessionGenerationRef.current) void clearSession();
				});
			}
		});
		return () => subscription.remove();
	}, [clearSession, refreshSession, token, tokenExpiresAt]);

	// Give the transport layer a guarded single retry for 401s on requests we
	// sent with a bearer token. Null outcome means recovery failed and the
	// session has already been torn down.
	useEffect(() => {
		setAccessTokenRefresher(async () => {
			const generation = sessionGenerationRef.current;
			try {
				const session = await refreshSession();
				if (!session || generation !== sessionGenerationRef.current) return null;
				return session.accessToken;
			} catch {
				if (generation === sessionGenerationRef.current) await clearSession();
				return null;
			}
		});
		return () => setAccessTokenRefresher(null);
	}, [clearSession, refreshSession]);

	const login = useCallback(
		async (input: LoginInput) => {
			setError(null);
			try {
				const result = await authService.login(input);
				if (!("requiresTwoFactor" in result)) await establishSession(result);
				return result;
			} catch (caught) {
				setError(toMessage(caught, "Login failed"));
				throw caught;
			}
		},
		[establishSession],
	);

	const verifyTwoFactor = useCallback(
		async (input: TwoFactorInput) => {
			await establishSession(await authService.verifyTwoFactor(input));
		},
		[establishSession],
	);

	const register = useCallback(async (input: RegisterInput) => {
		setError(null);
		try {
			return await authService.register(input);
		} catch (caught) {
			setError(toMessage(caught, "Registration failed"));
			throw caught;
		}
	}, []);

	const consumeMagicLink = useCallback(
		async (magicToken: string) => {
			await establishSession(await authService.consumeMagicLink(magicToken));
		},
		[establishSession],
	);

	const logout = useCallback(async () => {
		try {
			await authService.logout();
		} finally {
			await clearSession();
		}
	}, [clearSession]);

	const logoutAll = useCallback(async () => {
		try {
			if (token) await authService.logoutAll(token);
		} finally {
			await clearSession();
		}
	}, [clearSession, token]);

	const refreshUser = useCallback(async () => {
		if (!token) return;
		try {
			setUser(await usersService.getCurrent(token));
		} catch (caught) {
			if (caught instanceof ApiError && caught.statusCode === 401) {
				await refreshSession();
				return;
			}
			throw caught;
		}
	}, [refreshSession, token]);

	const establishSessionForContext = useCallback(
		async (session: AuthSession) => {
			await establishSession(session);
		},
		[establishSession],
	);

	return (
		<AuthContext.Provider
			value={{
				token,
				user,
				loading,
				error,
				login,
				verifyTwoFactor,
				register,
				consumeMagicLink,
				establishSession: establishSessionForContext,
				logout,
				logoutAll,
				refreshUser,
				clearError: () => setError(null),
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth(): AuthContextValue {
	const context = useContext(AuthContext);
	if (!context) throw new Error("useAuth must be used within AuthProvider");
	return context;
}

function toMessage(error: unknown, fallback: string): string {
	return error instanceof Error ? error.message : fallback;
}
