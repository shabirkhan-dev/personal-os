import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { AppState } from "react-native";
import { setAccessTokenRefresher } from "@/lib/api/client";
import { authService } from "../services/auth.service";
import type { AuthSession } from "../types/auth.types";
import { AuthProvider, useAuth } from "./auth-context";

jest.mock("@/lib/api/client", () => ({
	...jest.requireActual("@/lib/api/client"),
	setAccessTokenRefresher: jest.fn(),
}));

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
const mockedRegisterRefresher = jest.mocked(setAccessTokenRefresher);

function sessionFixture(expiresInSeconds: number): AuthSession {
	return {
		accessToken: `access-token-${expiresInSeconds}`,
		accessTokenExpiresAt: new Date(Date.now() + expiresInSeconds * 1_000).toISOString(),
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
}

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

let appStateHandler: ((state: string) => void) | undefined;

beforeEach(() => {
	jest.clearAllMocks();
	appStateHandler = undefined;
	jest.mocked(AppState.addEventListener).mockImplementation(((
		_event: string,
		callback: (state: string) => void,
	) => {
		appStateHandler = callback;
		return { remove: jest.fn() };
	}) as never);
});

async function renderBootstrappedAuth(expiresInSeconds: number) {
	mockedRefresh.mockResolvedValue(sessionFixture(expiresInSeconds));
	const { wrapper } = createWrapper();
	const rendered = renderHook(() => useAuth(), { wrapper });
	await waitFor(() => expect(rendered.result.current.loading).toBe(false));
	return rendered;
}

describe("foreground revalidation", () => {
	it("refreshes once when resuming with an expiring or expired access token", async () => {
		const { result } = await renderBootstrappedAuth(-10);

		mockedRefresh.mockResolvedValue(sessionFixture(3_600));
		await act(async () => {
			appStateHandler?.("active");
			appStateHandler?.("active");
			await Promise.resolve();
		});

		await waitFor(() => expect(result.current.token).toBe("access-token-3600"));
		expect(mockedRefresh).toHaveBeenCalledTimes(2);
	});

	it("does not refresh when resuming with a valid access token", async () => {
		await renderBootstrappedAuth(3_600);

		await act(async () => {
			appStateHandler?.("active");
			appStateHandler?.("background");
			appStateHandler?.("active");
		});

		expect(mockedRefresh).toHaveBeenCalledTimes(1);
	});
});

describe("single-flight refresh", () => {
	it("joins concurrent triggers into one network refresh", async () => {
		const bootstrapped = sessionFixture(-10);
		mockedRefresh.mockResolvedValueOnce(bootstrapped);
		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useAuth(), { wrapper });
		await waitFor(() => expect(result.current.loading).toBe(false));

		let releaseRefresh!: (session: AuthSession) => void;
		mockedRefresh.mockImplementation(
			() =>
				new Promise<AuthSession>((resolve) => {
					releaseRefresh = resolve;
				}),
		);

		await act(async () => {
			appStateHandler?.("active");
			appStateHandler?.("active");
			releaseRefresh(sessionFixture(3_600));
		});

		await waitFor(() => expect(result.current.token).toBe("access-token-3600"));
		expect(mockedRefresh).toHaveBeenCalledTimes(2);
	});
});

describe("transport 401 refresher wiring", () => {
	it("hands the refreshed access token to the api client", async () => {
		const { result } = await renderBootstrappedAuth(3_600);

		const registered = mockedRegisterRefresher.mock.calls[0]?.[0];
		expect(registered).toBeDefined();

		mockedRefresh.mockClear();
		mockedRefresh.mockResolvedValue(sessionFixture(7_200));
		if (registered) {
			await act(async () => {
				await expect(registered()).resolves.toBe("access-token-7200");
			});
		}
		await waitFor(() => expect(result.current.token).toBe("access-token-7200"));
	});

	it("clears the session and reports no token when recovery fails", async () => {
		const { result } = await renderBootstrappedAuth(3_600);

		const registered = mockedRegisterRefresher.mock.calls[0]?.[0];
		expect(registered).toBeDefined();

		mockedRefresh.mockClear();
		mockedRefresh.mockRejectedValue(new Error("refresh rejected"));
		if (registered) {
			await act(async () => {
				await expect(registered()).resolves.toBeNull();
			});
		}
		await waitFor(() => expect(result.current.token).toBeNull());
	});
});
