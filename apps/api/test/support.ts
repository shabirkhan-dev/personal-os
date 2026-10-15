import { createApp } from "@/app";
import { openDatabase } from "@/db/client";

export const TEST_DATABASE_URL =
	process.env.TEST_DATABASE_URL ??
	"postgresql://personal_os:personal_os@localhost:5433/personal_os_api_test";

/** An in-memory stand-in for the R2 binding: just the calls the API makes. */
export function memoryBucket() {
	const objects = new Map<string, { size: number; contentType: string }>();
	const bucket = {
		objects,
		put(key: string, size: number, contentType: string) {
			objects.set(key, { size, contentType });
		},
		async head(key: string) {
			const object = objects.get(key);
			return object
				? { key, size: object.size, httpMetadata: { contentType: object.contentType } }
				: null;
		},
		async delete(key: string) {
			objects.delete(key);
		},
	};
	return bucket;
}

export const testEnv = (overrides: Record<string, unknown> = {}) => ({
	ENVIRONMENT: "test",
	AI_PROVIDER: "mock",
	R2_ACCOUNT_ID: "account123",
	R2_BUCKET_NAME: "personal-os-assets",
	R2_ACCESS_KEY_ID: "test-access-key",
	R2_SECRET_ACCESS_KEY: "test-secret-key",
	R2_PUBLIC_URL: "https://assets.example.com",
	...overrides,
});

const shared = openDatabase(TEST_DATABASE_URL);
export const db = shared.db;

/** The app with one shared test database, plus a typed request helper. */
export function testApp(env: Record<string, unknown> = testEnv()) {
	const app = createApp({ openDatabase: () => ({ db: shared.db, close: async () => undefined }) });
	const call = async <T = unknown>(
		method: string,
		path: string,
		options: { body?: unknown; token?: string; headers?: Record<string, string> } = {},
	) => {
		const headers: Record<string, string> = { ...options.headers };
		if (options.body !== undefined) headers["Content-Type"] = "application/json";
		if (options.token) headers.Authorization = `Bearer ${options.token}`;
		const response = await app.request(
			`/api/v1${path}`,
			{
				method,
				headers,
				...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
			},
			env,
		);
		const json =
			response.status === 204 ? null : ((await response.json()) as T & Record<string, unknown>);
		return { status: response.status, json: json as (T & Record<string, unknown>) | null };
	};
	return { app, call };
}

type Session = { accessToken: string; refreshToken: string; user: { id: string; email: string } };

/** Signs a fresh account in through the real email-code routes. */
export async function signIn(
	call: ReturnType<typeof testApp>["call"],
	email = `user-${crypto.randomUUID()}@example.com`,
	name?: string,
): Promise<Session> {
	const sent = await call<{ data: { developmentCode: string } }>(
		"POST",
		"/auth/email-code/request",
		{
			body: { email, ...(name ? { name } : {}) },
		},
	);
	const code = sent.json?.data.developmentCode;
	const verified = await call<{ data: Session }>("POST", "/auth/email-code/verify", {
		body: { email, code },
	});
	if (verified.status !== 200 || !verified.json)
		throw new Error(`sign-in failed: ${verified.status}`);
	return verified.json.data;
}
