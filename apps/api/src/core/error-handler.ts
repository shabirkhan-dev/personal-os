import type { ErrorHandler, NotFoundHandler } from "hono";
import { HTTPException } from "hono/http-exception";

import { errors } from "@/config/messages";
import { AppError } from "./app-error";
import type { AppContext, AppEnv } from "./context";
import type { ApiFailure } from "./response";

function fail(c: AppContext, error: AppError) {
	const body: ApiFailure = {
		success: false,
		statusCode: error.status,
		code: error.code,
		message: error.message,
		requestId: c.get("requestId") ?? "req_unknown",
		timestamp: new Date().toISOString(),
		path: c.req.path,
		method: c.req.method,
		...(error.options.issues ? { errors: error.options.issues } : {}),
	};
	return c.json(body, error.status);
}

/** Known errors keep their code; anything else is logged and answered as a plain 500. */
export const onError: ErrorHandler<AppEnv> = (error, c) => {
	if (error instanceof AppError) return fail(c, error);
	if (error instanceof HTTPException && error.status === 413) {
		return fail(c, new AppError("BODY_TOO_LARGE"));
	}
	console.error(`[api] ${c.req.method} ${c.req.path} failed`, error);
	return fail(c, new AppError("INTERNAL_ERROR", { message: errors.INTERNAL_ERROR.message }));
};

export const onNotFound: NotFoundHandler<AppEnv> = (c) => fail(c, new AppError("NOT_FOUND"));
