/** Fixed product settings. Anything that differs per environment lives in `env.ts` instead. */
export const settings = {
	api: { prefix: "/api/v1", service: "personal-os-api" },
	auth: {
		accessTokenTtlMs: 15 * 60_000,
		sessionTtlDays: 30,
		codeTtlMinutes: 10,
		codeMaxAttempts: 5,
		/**
		 * A refresh whose answer was lost (a phone dropping signal) retries with the old token; it is
		 * accepted for this long instead of being treated as theft.
		 */
		refreshGraceMs: 60_000,
		/** Per email, whatever IP asks: one code a minute and a handful a day. */
		codeCooldownSeconds: 60,
		codesPerDay: 10,
	},
	sync: {
		/** Matches the app's `PUSH_BATCH`. */
		maxPush: 200,
		pullPage: 500,
		/** A pull page also stops at this many bytes of record data, to stay far below Worker memory. */
		pullBytes: 4 * 1024 * 1024,
		maxRecordBytes: 64 * 1024,
		/** Client clocks may run ahead a little; later times are clamped so they can't win forever. */
		maxClockSkewMs: 24 * 60 * 60_000,
	},
	assets: {
		uploadTtlSeconds: 10 * 60,
		avatar: {
			maxBytes: 5 * 1024 * 1024,
			types: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" },
		},
	},
	ai: {
		maxBodyBytes: 32 * 1024,
		timeoutMs: 60_000,
		/** Caps each answer's length, and so its cost. */
		maxOutputTokens: 4000,
		/** AI calls per user per UTC day. */
		callsPerDay: 150,
		page: {
			maxBytes: 2_000_000,
			maxRedirects: 3,
			maxText: 12_000,
			minText: 200,
			timeoutMs: 10_000,
		},
	},
	/** Request bodies above this are refused before parsing. */
	maxBodyBytes: 1024 * 1024,
} as const;
