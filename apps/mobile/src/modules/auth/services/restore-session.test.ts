/// <reference types="bun" />
import { describe, expect, mock, test } from "bun:test";

mock.module("expo-constants", () => ({ default: { expoConfig: null, manifest2: null } }));
mock.module("react-native", () => ({ Platform: { OS: "ios" } }));

const { ApiError } = await import("@/lib/api/client");
const { restoreSession } = await import("./restore-session");

const session = {
	accessToken: "access",
	accessTokenExpiresAt: "2026-10-13T00:15:00.000Z",
	refreshToken: "refresh-2",
	user: {
		id: "u1",
		email: "you@example.com",
		username: "you",
		isActive: true,
		emailVerified: true,
		hasPassword: false,
		createdAt: "2026-10-13T00:00:00.000Z",
	},
};

function deps(overrides: Partial<Parameters<typeof restoreSession>[0]> = {}) {
	return {
		readToken: mock(async () => "refresh-1" as string | null),
		refresh: mock(async () => session),
		clearToken: mock(async () => undefined),
		warn: mock(() => undefined),
		...overrides,
	};
}

describe("restoreSession", () => {
	test("makes no request without a saved token", async () => {
		const d = deps({ readToken: mock(async () => null) });
		expect(await restoreSession(d)).toEqual({ status: "signed-out" });
		expect(d.refresh).not.toHaveBeenCalled();
	});

	test("starts signed out when secure storage is unavailable", async () => {
		const d = deps({
			readToken: mock(async () => {
				throw new Error("no keychain");
			}),
		});
		expect(await restoreSession(d)).toEqual({ status: "signed-out" });
		expect(d.warn).toHaveBeenCalled();
	});

	test("restores a valid session", async () => {
		expect(await restoreSession(deps())).toEqual({ status: "signed-in", session });
	});

	test("drops a rejected token", async () => {
		const d = deps({
			refresh: mock(async () => {
				throw new ApiError("expired", 401, "AUTH_REFRESH_INVALID");
			}),
		});
		expect(await restoreSession(d)).toEqual({ status: "signed-out" });
		expect(d.clearToken).toHaveBeenCalled();
	});

	test("keeps the token and reports offline when the API is unreachable", async () => {
		const d = deps({
			refresh: mock(async () => {
				throw new ApiError("Cannot reach API", 0, "API_UNREACHABLE");
			}),
		});
		expect(await restoreSession(d)).toEqual({ status: "offline", error: "Cannot reach API" });
		expect(d.clearToken).not.toHaveBeenCalled();
		expect(d.warn).toHaveBeenCalled();
	});
});
