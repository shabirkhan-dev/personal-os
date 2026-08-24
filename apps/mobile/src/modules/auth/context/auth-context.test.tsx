import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
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
const mockedSetRefreshToken = jest.mocked(tokenStorage.setRefreshToken);

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
});
