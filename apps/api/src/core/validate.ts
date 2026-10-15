import { zValidator } from "@hono/zod-validator";
import type { ValidationTargets } from "hono";
import type * as z from "zod";

import { AppError } from "./app-error";

/** `zValidator` that fails with `VALIDATION_FAILED` and the issues in the standard envelope. */
export function validate<Target extends keyof ValidationTargets, Schema extends z.ZodType>(
	target: Target,
	schema: Schema,
) {
	return zValidator(target, schema, (result) => {
		if (!result.success) {
			throw new AppError("VALIDATION_FAILED", {
				issues: result.error.issues.map((issue) => ({
					path: issue.path.map(String).join("."),
					message: issue.message,
				})),
			});
		}
	});
}
