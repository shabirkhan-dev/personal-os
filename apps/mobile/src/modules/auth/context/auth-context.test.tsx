import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { ApiError } from "@/lib/api/client";
import { usersService } from "@/modules/users/services/users.service";
import { authService } from "../services/auth.service";
import { tokenStorage } from "../services/token-storage";
import { AuthProvider, useAuth } from "./auth-context";

jest.mock("../services/auth.service", () => ({
	authService: {
		refresh: jest.fn(),
		logout: jest.fn().mockResolvedValue(undefined),
	},
}));

jest.mock("../services/token-storage", () => ({
	tokenStorage: {
		setRefreshToken: jest.fn().mockResolvedValue(undefined),
		getRefreshToken: jest.fn().mockResolvedValue(null),
	},
}));

jest.mock("@/modules/users/services/users.service", () => ({
	usersService: {
		getCurrent: jest.fn().mockResolvedValue({
			id: "user-1",
			email: "user@example.com",
			username: "user",
			isActive: true,
			emailVerified: true,
			hasPassword: true,
			createdAt: "2026-01-01T00:00:00.000Z",
		}),
	},
}));

const mockedRefresh = jest.mocked(authService.refresh);
const mockedGetCurrent = jest.mocked(usersService.getCurrent);
const mockedSetRefreshToken = jest.mocked(tokenStorage.setRefreshToken);

const profileUser = {
	id: "user-1",
	email: "user@example.com",
	username: "user",
	isActive: true,
	emailVerified: true,
	hasPassword: true,
	createdAt: "2026-01-01T00:00:00.000Z",
};

const session = {
	accessToken: "access-token",
	accessTokenExpiresAt: new Date(Date.now() + 3_600_000).toISOString(),
	refreshToken: "refresh-token",
	user: {
		id: "user-1",
		email: "user@example.com",
		username: "user",
		isActive: true,
		emailVerified: true,
		hasPassword: true,
		createdAt: "2026-01-01T00:00:00.000Z",
	},
};

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: 0, gcTime: Number.POSITIVE_INFINITY } },
	});
	const wrapper = ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>{children}</AuthProvider>
		</QueryClientProvider>
	);
	return { wrapper, queryClient };
}

describe("AuthProvider session bootstrap", () => {
	it("restores the session on cold start when refresh succeeds", async () => {
		mockedRefresh.mockResolvedValue(session);
		const { wrapper } = createWrapper();

		const { result } = renderHook(() => useAuth(), { wrapper });

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.token).toBe("access-token");
		expect(result.current.user?.id).toBe("user-1");
	});

	it("clears the stored refresh token and exposes no session when bootstrap fails", async () => {
		mockedRefresh.mockRejectedValue(new Error("invalid refresh token"));
		const { wrapper } = createWrapper();

		const { result } = renderHook(() => useAuth(), { wrapper });

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.token).toBeNull();
		expect(result.current.user).toBeNull();
		expect(mockedSetRefreshToken).toHaveBeenCalledWith(null);
	});
});

describe("AuthProvider query cache isolation", () => {
	it("wipes cached query data when a failed bootstrap tears down the session", async () => {
		mockedRefresh.mockRejectedValue(new Error("invalid refresh token"));
		const { wrapper, queryClient } = createWrapper();
		queryClient.setQueryData(["routines", "user-1", "today"], {
			date: "2026-08-24",
		});

		renderHook(() => useAuth(), { wrapper });

		await waitFor(() =>
			expect(queryClient.getQueryData(["routines", "user-1", "today"])).toBeUndefined(),
		);
	});

	it("wipes cached query data on logout so another account cannot read it", async () => {
		mockedRefresh.mockResolvedValue(session);
		const { wrapper, queryClient } = createWrapper();

		const { result } = renderHook(() => useAuth(), { wrapper });
		await waitFor(() => expect(result.current.loading).toBe(false));
		queryClient.setQueryData(["routines", "user-1", "today"], {
			date: "2026-08-24",
		});

		await waitFor(async () => {
			await result.current.logout();
			expect(queryClient.getQueryData(["routines", "user-1", "today"])).toBeUndefined();
			expect(result.current.token).toBeNull();
		});
	});

	it("removes user A's cached data before exposing user B's session on account switch", async () => {
		mockedRefresh.mockResolvedValue(session);
		const { wrapper, queryClient } = createWrapper();

		const { result } = renderHook(() => useAuth(), { wrapper });
		await waitFor(() => expect(result.current.user?.id).toBe("user-1"));
		const userASecret = { date: "2026-08-24", routines: [{ name: "A-private" }] };
		queryClient.setQueryData(["routines", "user-1", "today"], userASecret);

		const userBSession: typeof session = {
			...session,
			accessToken: "access-token-b",
			user: { ...session.user, id: "user-2", email: "other@example.com" },
		};
		mockedGetCurrent.mockResolvedValueOnce({ ...profileUser, id: "user-2" });
		await act(async () => {
			await result.current.establishSession(userBSession);
		});

		// A's rows are gone from the cache entirely…
		expect(queryClient.getQueryData(["routines", "user-1", "today"])).toBeUndefined();
		// …and B has no inherited data to render while their own queries load.
		expect(result.current.token).toBe("access-token-b");
		expect(result.current.user?.id).toBe("user-2");
		expect(queryClient.getQueryData(["routines", "user-2", "today"])).toBeUndefined();
	});

	it("cancels in-flight queries for the previous user during account switch", async () => {
		mockedRefresh.mockResolvedValue(session);
		const { wrapper, queryClient } = createWrapper();

		const { result } = renderHook(() => useAuth(), { wrapper });
		await waitFor(() => expect(result.current.user?.id).toBe("user-1"));

		let abortSignal: AbortSignal | undefined;
		const hangingQuery = queryClient.fetchQuery({
			queryKey: ["routines", "user-1", "list"],
			queryFn: ({ signal }) =>
				new Promise((_resolve, reject) => {
					abortSignal = signal;
					signal?.addEventListener("abort", () => reject(new Error("aborted")));
				}),
		});

		const userBSession: typeof session = {
			...session,
			user: { ...session.user, id: "user-2" },
		};
		// Attach the rejection expectation up front so the cancellation inside
		// establishSession never surfaces as an unhandled rejection.
		const cancellation = expect(hangingQuery).rejects.toThrow();
		await act(async () => {
			await result.current.establishSession(userBSession);
		});

		// React Query's retryer settles the cancelled fetch with CancelledError.
		await cancellation;
		expect(abortSignal?.aborted).toBe(true);
		expect(queryClient.getQueryData(["routines", "user-1", "list"])).toBeUndefined();
	});

	it("keeps cached data when refreshing the same user (no purge on identity match)", async () => {
		mockedRefresh.mockResolvedValue(session);
		mockedGetCurrent.mockResolvedValueOnce(profileUser);
		const { wrapper, queryClient } = createWrapper();

		const { result } = renderHook(() => useAuth(), { wrapper });
		await waitFor(() => expect(result.current.user?.id).toBe("user-1"));
		queryClient.setQueryData(["routines", "user-1", "today"], {
			date: "2026-08-24",
		});

		// refreshUser hits a 401, triggers a same-user refresh, and retries.
		mockedGetCurrent.mockRejectedValueOnce(new ApiError("token expired", 401, "UNAUTHORIZED"));
		mockedRefresh.mockClear();
		mockedRefresh.mockResolvedValue(session);
		await act(async () => {
			await result.current.refreshUser();
		});

		expect(mockedRefresh).toHaveBeenCalledTimes(1);
		expect(queryClient.getQueryData(["routines", "user-1", "today"])).toEqual({
			date: "2026-08-24",
		});
		expect(result.current.token).toBe(session.accessToken);
	});
});
