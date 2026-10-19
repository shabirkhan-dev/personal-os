import Constants from "expo-constants";
import { Platform } from "react-native";

interface ApiSuccess<T> {
	success: true;
	statusCode: number;
	data: T;
}

interface ApiFailure {
	success: false;
	statusCode: number;
	code?: string;
	message?: string;
	errors?: ReadonlyArray<{ path?: string; message?: string }>;
}

export class ApiError extends Error {
	constructor(
		message: string,
		readonly statusCode: number,
		readonly code?: string,
		readonly issues?: ApiFailure["errors"],
	) {
		super(message);
		this.name = "ApiError";
	}
}

const REQUEST_TIMEOUT_MS = 15_000;
/** Release builds; `__DEV__` is undefined under the unit tests. */
const IS_DEV = typeof __DEV__ === "undefined" || __DEV__;
const apiOrigin = pickApiOrigin(process.env.EXPO_PUBLIC_API_URL);
const apiPrefix = "/api/v1";

export type ApiRequestOptions = RequestInit & {
	accessToken?: string;
	/** Set on the one retry after a refresh, so an expired token never loops. */
	retried?: boolean;
	/** How long to wait before giving up; AI calls need longer than the default 15 s. */
	timeoutMs?: number;
};

export const apiClient = {
	get<T>(path: string, options?: ApiRequestOptions): Promise<T> {
		return request<T>(path, { ...options, method: "GET" });
	},
	post<T>(path: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
		return request<T>(path, {
			...options,
			method: "POST",
			...(body === undefined ? {} : { body: JSON.stringify(body) }),
		});
	},
	put<T>(path: string, body: unknown, options?: ApiRequestOptions): Promise<T> {
		return request<T>(path, { ...options, method: "PUT", body: JSON.stringify(body) });
	},
	patch<T>(path: string, body: unknown, options?: ApiRequestOptions): Promise<T> {
		return request<T>(path, { ...options, method: "PATCH", body: JSON.stringify(body) });
	},
	delete<T>(path: string, options?: ApiRequestOptions): Promise<T> {
		return request<T>(path, { ...options, method: "DELETE" });
	},
};

type TokenRefresher = () => Promise<string | null>;
let refreshAccessToken: TokenRefresher | null = null;

/**
 * Registers how to get a fresh access token. A request rejected with an expired token asks for
 * one and is retried once with it. Returns the unregister function.
 */
export function onExpiredAccessToken(refresher: TokenRefresher): () => void {
	refreshAccessToken = refresher;
	return () => {
		if (refreshAccessToken === refresher) refreshAccessToken = null;
	};
}

export function getApiOrigin(): string | null {
	return apiOrigin;
}

async function request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
	try {
		return await send<T>(path, options);
	} catch (error) {
		const expired =
			error instanceof ApiError &&
			error.code === "AUTH_ACCESS_TOKEN_INVALID" &&
			options.accessToken;
		if (!expired || options.retried || !refreshAccessToken) throw error;
		const accessToken = await refreshAccessToken();
		if (!accessToken || accessToken === options.accessToken) throw error;
		return send<T>(path, { ...options, accessToken, retried: true });
	}
}

async function send<T>(path: string, options: ApiRequestOptions): Promise<T> {
	if (!apiOrigin) {
		throw new ApiError(
			"This version of Personal OS can't reach its server. Update the app.",
			0,
			"API_NOT_CONFIGURED",
		);
	}
	const {
		accessToken,
		retried: _retried,
		signal: outerSignal,
		timeoutMs = REQUEST_TIMEOUT_MS,
		...init
	} = options;
	const headers = new Headers(init.headers);
	if (init.body) headers.set("Content-Type", "application/json");
	if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

	const url = `${apiOrigin}${apiPrefix}${normalizePath(path)}`;
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);
	const onOuterAbort = () => controller.abort();
	outerSignal?.addEventListener("abort", onOuterAbort);

	try {
		const response = await fetch(url, {
			...init,
			headers,
			signal: controller.signal,
		});
		if (response.status === 204) return undefined as T;

		const payload: unknown = await response.json().catch(() => ({}));
		if (!response.ok) {
			const failure = payload as ApiFailure;
			throw new ApiError(
				typeof failure.message === "string"
					? failure.message
					: response.statusText || "Request failed",
				response.status,
				failure.code,
				failure.errors,
			);
		}
		return isSuccess<T>(payload) ? payload.data : (payload as T);
	} catch (caught) {
		if (caught instanceof ApiError) throw caught;
		if (isAbortError(caught)) {
			throw new ApiError(
				IS_DEV
					? `Request timed out reaching ${apiOrigin}. Is the API running and EXPO_PUBLIC_API_URL correct for this device?`
					: "The server took too long to answer. Try again.",
				408,
				"API_TIMEOUT",
			);
		}
		throw new ApiError(
			IS_DEV
				? `Cannot reach API at ${apiOrigin}. Use your computer LAN IP on a physical phone (not localhost).`
				: "Can't reach Personal OS. Check your connection and try again.",
			0,
			"API_UNREACHABLE",
		);
	} finally {
		clearTimeout(timeout);
		outerSignal?.removeEventListener("abort", onOuterAbort);
	}
}

/**
 * Prefer Metro's host so Expo Go on a real phone hits the same machine as the bundler.
 * Android emulator → 10.0.2.2; iOS simulator → localhost.
 */
function defaultApiOrigin(): string {
	const metroHost = getExpoMetroHost();
	if (metroHost && metroHost !== "localhost" && metroHost !== "127.0.0.1") {
		return `http://${metroHost}:4000`;
	}
	if (Platform.OS === "android") return "http://10.0.2.2:4000";
	return "http://localhost:4000";
}

function getExpoMetroHost(): string | null {
	const hostUri =
		Constants.expoConfig?.hostUri ??
		Constants.manifest2?.extra?.expoGo?.debuggerHost ??
		(Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost;

	if (typeof hostUri !== "string" || hostUri.length === 0) return null;
	const host = hostUri.split(":")[0]?.trim();
	return host || null;
}

/**
 * Development falls back to the Metro host or the emulator alias. A release build only uses its
 * configured https URL; without one, requests fail with API_NOT_CONFIGURED instead of quietly
 * calling localhost, and a bad value never crashes the app at startup.
 */
function pickApiOrigin(configured: string | undefined): string | null {
	if (configured) {
		try {
			const url = new URL(configured);
			if (IS_DEV || url.protocol === "https:") return url.origin;
			console.error(`[api] release builds need an https EXPO_PUBLIC_API_URL, not ${configured}`);
		} catch (error) {
			console.error(`[api] EXPO_PUBLIC_API_URL is not a URL: ${configured}`, error);
		}
		return IS_DEV ? defaultApiOrigin() : null;
	}
	if (IS_DEV) return defaultApiOrigin();
	console.error("[api] EXPO_PUBLIC_API_URL was not set for this build");
	return null;
}

function normalizePath(path: string): string {
	return path.startsWith("/") ? path : `/${path}`;
}

function isAbortError(error: unknown): boolean {
	return (
		(error instanceof Error && error.name === "AbortError") ||
		(typeof DOMException !== "undefined" &&
			error instanceof DOMException &&
			error.name === "AbortError")
	);
}

function isSuccess<T>(payload: unknown): payload is ApiSuccess<T> {
	return (
		typeof payload === "object" &&
		payload !== null &&
		"success" in payload &&
		payload.success === true &&
		"data" in payload
	);
}
