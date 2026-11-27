import type { ErrorHandler, NotFoundHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { AiError } from "@personal-os/ai";

import { errors } from "@/config/messages";
import { AppError } from "./app-error";
import type { AppContext, AppEnv } from "./context";
import { reportError } from "./report-error";
import type { ApiFailure } from "./response";

/** The Worker's `waitUntil`, when there is one (tests and scripts run without it). */
function waitUntilOf(c: AppContext): ((promise: Promise<unknown>) => void) | undefined {
	try {
		const context = c.executionCtx;
		return (promise) => context.waitUntil(promise);
	} catch {
		return undefined;
	}
}

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

/** The shared AI package's errors as API errors; the server's own key problems stay internal. */
function fromAiError(error: AiError): AppError {
	switch (error.code) {
		case "invalid_output":
			return new AppError("AI_INVALID_OUTPUT");
		case "page_unreadable":
			return new AppError("JOB_LINK_UNREADABLE", { message: error.message });
		default:
			return new AppError("AI_UNAVAILABLE", { cause: error });
	}
}

/** Known errors keep their code; anything else is logged and answered as a plain 500. */
export const onError: ErrorHandler<AppEnv> = (error, c) => {
	if (error instanceof AppError) return fail(c, error);
	if (error instanceof AiError) return fail(c, fromAiError(error));
	if (error instanceof HTTPException && error.status === 413) {
		return fail(c, new AppError("BODY_TOO_LARGE"));
	}
	console.error(`[api] ${c.req.method} ${c.req.path} failed`, error);
	reportError(
		c.get("config"),
		error,
		{
			tags: { route: c.req.routePath || c.req.path, method: c.req.method },
			extra: { requestId: c.get("requestId") ?? "req_unknown" },
		},
		waitUntilOf(c),
	);
	return fail(c, new AppError("INTERNAL_ERROR", { message: errors.INTERNAL_ERROR.message }));
};

export const onNotFound: NotFoundHandler<AppEnv> = (c) => fail(c, new AppError("NOT_FOUND"));
