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
import { askCareSchema } from "./care.schema";
import { askCare } from "./care.tasks";
import { askFashionSchema, readPieceSchema } from "./fashion.schema";
import { askFashion, readPiece } from "./fashion.tasks";
import { askFaithSchema } from "./faith.schema";
import { askFaith } from "./faith.tasks";
import { askFoodSchema, readMealSchema } from "./food.schema";
import { askTrainingSchema, skillStepsSchema } from "./training.schema";
import { askTraining, buildSkill } from "./training.tasks";
import { askFood, readMeal } from "./food.tasks";

/** Module AI, `POST /ai/<module>/<task>`. Signed-in only; the provider key never leaves the API. */
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
	)
	.post("/faith/ask", validate("json", askFaithSchema), async (c) =>
		ok(c, await askFaith({ config: c.get("config") }, c.req.valid("json"))),
	)
	.post("/fashion/read-piece", validate("json", readPieceSchema), async (c) =>
		ok(c, await readPiece({ config: c.get("config") }, c.req.valid("json"))),
	)
	.post("/fashion/ask", validate("json", askFashionSchema), async (c) =>
		ok(c, await askFashion({ config: c.get("config") }, c.req.valid("json"))),
	)
	.post("/food/read-meal", validate("json", readMealSchema), async (c) =>
		ok(c, await readMeal({ config: c.get("config") }, c.req.valid("json"))),
	)
	.post("/food/ask", validate("json", askFoodSchema), async (c) =>
		ok(c, await askFood({ config: c.get("config") }, c.req.valid("json"))),
	)
	.post("/care/ask", validate("json", askCareSchema), async (c) =>
		ok(c, await askCare({ config: c.get("config") }, c.req.valid("json"))),
	)
	.post("/training/ask", validate("json", askTrainingSchema), async (c) =>
		ok(c, await askTraining({ config: c.get("config") }, c.req.valid("json"))),
	)
	.post("/training/skill", validate("json", skillStepsSchema), async (c) =>
		ok(c, await buildSkill({ config: c.get("config") }, c.req.valid("json"))),
	);
