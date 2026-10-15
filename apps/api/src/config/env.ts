import * as z from "zod";

const DEV_JWT_SECRET = "development-only-jwt-secret-change-me-please";
const DEV_TOKEN_SECRET = "development-only-auth-token-secret-change-me";

const optional = z
	.string()
	.trim()
	.transform((value) => value || undefined)
	.optional();

const envSchema = z
	.object({
		ENVIRONMENT: z.enum(["development", "test", "production"]).default("production"),
		APP_NAME: z.string().min(1).max(80).default("Personal OS"),
		AUTH_EMAIL_FROM: z.string().min(3).default("Personal OS <auth@example.com>"),
		JWT_SECRET: z.string().min(32).default(DEV_JWT_SECRET),
		AUTH_TOKEN_SECRET: z.string().min(32).default(DEV_TOKEN_SECRET),
		RESEND_API_KEY: optional,
		AI_PROVIDER: z.enum(["mock", "openai_compatible"]).default("mock"),
		OPENAI_API_KEY: optional,
		OPENAI_BASE_URL: z.url().default("https://api.openai.com/v1"),
		OPENAI_MODEL: z.string().min(1).default("gpt-4o-mini"),
		R2_ACCOUNT_ID: optional,
		R2_BUCKET_NAME: z.string().min(3).default("personal-os-assets"),
		R2_ACCESS_KEY_ID: optional,
		R2_SECRET_ACCESS_KEY: optional,
		R2_PUBLIC_URL: optional.pipe(z.url().optional()),
		DATABASE_URL: optional,
	})
	.superRefine((env, context) => {
		const require = (path: string, message: string) =>
			context.addIssue({ code: "custom", path: [path], message });
		if (env.AI_PROVIDER === "openai_compatible" && !env.OPENAI_API_KEY) {
			require("OPENAI_API_KEY", "required when AI_PROVIDER=openai_compatible");
		}
		if (env.ENVIRONMENT !== "production") return;
		if (env.JWT_SECRET === DEV_JWT_SECRET) require("JWT_SECRET", "must be set in production");
		if (env.AUTH_TOKEN_SECRET === DEV_TOKEN_SECRET) {
			require("AUTH_TOKEN_SECRET", "must be set in production");
		}
		if (!env.RESEND_API_KEY) require("RESEND_API_KEY", "required in production");
	});

/** Everything the code reads about its environment, typed and checked. */
export type Config = {
	environment: "development" | "test" | "production";
	isProduction: boolean;
	appName: string;
	auth: {
		jwtSecret: Uint8Array;
		tokenSecret: string;
		/** Outside production without an email key, codes come back in the response. */
		exposeCodes: boolean;
	};
	email: { resendApiKey?: string; from: string };
	ai:
		| { provider: "mock" }
		| { provider: "openai_compatible"; apiKey: string; baseUrl: string; model: string };
	/** Avatar uploads need all of these; without them `POST /assets/uploads` answers 503. */
	r2?: {
		accountId: string;
		bucket: string;
		accessKeyId: string;
		secretAccessKey: string;
		publicUrl: string;
	};
	databaseUrl?: string;
};

export function parseConfig(source: Record<string, unknown>): Config {
	const result = envSchema.safeParse(source);
	if (!result.success) {
		const issues = result.error.issues
			.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
			.join("; ");
		throw new Error(`Invalid environment configuration: ${issues}`);
	}
	const env = result.data;
	const isProduction = env.ENVIRONMENT === "production";
	return {
		environment: env.ENVIRONMENT,
		isProduction,
		appName: env.APP_NAME,
		auth: {
			jwtSecret: new TextEncoder().encode(env.JWT_SECRET),
			tokenSecret: env.AUTH_TOKEN_SECRET,
			exposeCodes: !isProduction && !env.RESEND_API_KEY,
		},
		email: {
			...(env.RESEND_API_KEY ? { resendApiKey: env.RESEND_API_KEY } : {}),
			from: env.AUTH_EMAIL_FROM,
		},
		ai:
			env.AI_PROVIDER === "openai_compatible" && env.OPENAI_API_KEY
				? {
						provider: "openai_compatible",
						apiKey: env.OPENAI_API_KEY,
						baseUrl: env.OPENAI_BASE_URL.replace(/\/$/, ""),
						model: env.OPENAI_MODEL,
					}
				: { provider: "mock" },
		...(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_PUBLIC_URL
			? {
					r2: {
						accountId: env.R2_ACCOUNT_ID,
						bucket: env.R2_BUCKET_NAME,
						accessKeyId: env.R2_ACCESS_KEY_ID,
						secretAccessKey: env.R2_SECRET_ACCESS_KEY,
						publicUrl: env.R2_PUBLIC_URL.replace(/\/$/, ""),
					},
				}
			: {}),
		...(env.DATABASE_URL ? { databaseUrl: env.DATABASE_URL } : {}),
	};
}

const cache = new WeakMap<object, Config>();

/** Parses the Worker's env once per isolate; the same bindings object comes back every request. */
export function loadConfig(env: object): Config {
	const cached = cache.get(env);
	if (cached) return cached;
	const config = parseConfig(env as Record<string, unknown>);
	cache.set(env, config);
	return config;
}
