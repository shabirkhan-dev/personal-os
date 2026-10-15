import { Hono } from "hono";

import type { AppEnv } from "@/core/context";
import { dbOf } from "@/core/context";
import { ok } from "@/core/response";
import { validate } from "@/core/validate";
import { requireAuth } from "@/modules/auth/auth.middleware";
import { updateProfileSchema } from "./users.schema";
import { getCurrentUser, updateProfile } from "./users.service";

/** `requireAuth` per route, not `.use`, so it doesn't run again for `/users/me/onboarding`. */
export const usersRoutes = new Hono<AppEnv>()
	.get("/me", requireAuth, async (c) =>
		ok(c, await getCurrentUser(dbOf(c), c.get("config"), c.get("caller").userId)),
	)
	.patch("/me/profile", requireAuth, validate("json", updateProfileSchema), async (c) =>
		ok(
			c,
			await updateProfile(
				dbOf(c),
				c.get("config"),
				c.env.ASSETS,
				c.get("caller").userId,
				c.req.valid("json"),
			),
		),
	);
