import type { ContentfulStatusCode } from "hono/utils/http-status";

import type { ErrorIssue } from "./app-error";
import type { AppContext } from "./context";

/** Every successful JSON answer. The app reads `data`. */
export type ApiSuccess<T> = {
	success: true;
	statusCode: number;
	requestId: string;
	timestamp: string;
	data: T;
};

/** Every failure. `code` comes from `config/messages.ts`. */
export type ApiFailure = {
	success: false;
	statusCode: number;
	code: string;
	message: string;
	requestId: string;
	timestamp: string;
	path: string;
	method: string;
	errors?: readonly ErrorIssue[];
};

export function ok<T>(c: AppContext, data: T, status: ContentfulStatusCode = 200) {
	const body: ApiSuccess<T> = {
		success: true,
		statusCode: status,
		requestId: c.get("requestId"),
		timestamp: new Date().toISOString(),
		data,
	};
	return c.json(body, status);
}

export function noContent(c: AppContext) {
	return c.body(null, 204);
}
