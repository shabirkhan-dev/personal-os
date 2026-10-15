import { type ErrorCode, errors } from "@/config/messages";

export type ErrorIssue = { path: string; message: string };

/** A known failure. The code decides the status and message (see `config/messages.ts`). */
export class AppError extends Error {
	readonly status: (typeof errors)[ErrorCode]["status"];

	constructor(
		readonly code: ErrorCode,
		readonly options: { message?: string; issues?: readonly ErrorIssue[]; cause?: unknown } = {},
	) {
		super(options.message ?? errors[code].message, { cause: options.cause });
		this.name = "AppError";
		this.status = errors[code].status;
	}
}
