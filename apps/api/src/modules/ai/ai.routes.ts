import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";

import { settings } from "@/config/settings";
import { AppError } from "@/core/app-error";
import type { AppEnv } from "@/core/context";
import { rateLimit } from "@/core/rate-limit";
import { ok } from "@/core/response";
import { validate } from "@/core/validate";
import { requireAuth } from "@/modules/auth/auth.middleware";
import {
	interviewPrepSchema,
	nudgeSchema,
	parseLineSchema,
	readJobSchema,
	skillPathSchema,
} from "./career.schema";
import { buildInterviewPrep, draftNudge, parseLine, planSkillPath, readJob } from "./career.tasks";

/** Career AI, `POST /ai/career/<task>`. Signed-in only; the provider key never leaves the API. */
export const aiRoutes = new Hono<AppEnv>()
	.use(
		requireAuth,
		rateLimit("AI_LIMITER"),
		bodyLimit({
			maxSize: settings.ai.maxBodyBytes,
			onError: () => {
				throw new AppError("BODY_TOO_LARGE");
			},
		}),
	)
	.post("/career/read-job", validate("json", readJobSchema), async (c) =>
		ok(c, await readJob({ config: c.get("config") }, c.req.valid("json"))),
	)
	.post("/career/parse-line", validate("json", parseLineSchema), async (c) =>
		ok(c, await parseLine({ config: c.get("config") }, c.req.valid("json"))),
	)
	.post("/career/nudge", validate("json", nudgeSchema), async (c) =>
		ok(c, await draftNudge({ config: c.get("config") }, c.req.valid("json"))),
	)
	.post("/career/interview-prep", validate("json", interviewPrepSchema), async (c) =>
		ok(c, await buildInterviewPrep({ config: c.get("config") }, c.req.valid("json"))),
	)
	.post("/career/skill-path", validate("json", skillPathSchema), async (c) =>
		ok(c, await planSkillPath({ config: c.get("config") }, c.req.valid("json"))),
	);
