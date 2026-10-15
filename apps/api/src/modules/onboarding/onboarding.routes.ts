import { Hono } from "hono";

import { type AppEnv, dbOf } from "@/core/context";
import { ok } from "@/core/response";
import { validate } from "@/core/validate";
import { requireAuth } from "@/modules/auth/auth.middleware";
import { saveOnboardingSchema } from "./onboarding.schema";
import { getOnboarding, saveOnboarding } from "./onboarding.service";

export const onboardingRoutes = new Hono<AppEnv>()
	.use(requireAuth)
	.get("/", async (c) => ok(c, await getOnboarding(dbOf(c), c.get("caller").userId)))
	.put("/", validate("json", saveOnboardingSchema), async (c) =>
		ok(c, await saveOnboarding(dbOf(c), c.get("caller").userId, c.req.valid("json").answers)),
	);
