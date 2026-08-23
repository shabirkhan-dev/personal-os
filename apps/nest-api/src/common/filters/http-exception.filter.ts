import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
	Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { logRequest } from '@/common/observability/http-logging';
import type { ApiErrorResponse } from '@/common/types/api-response.type';
import type { RequestWithId } from '@/common/types/request-with-id.type';

type HttpExceptionPayload = {
	code?: string;
	message?: string | string[];
	error?: string;
	errors?: ReadonlyArray<unknown>;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger(HttpExceptionFilter.name);

	catch(exception: unknown, host: ArgumentsHost): void {
		const http = host.switchToHttp();
		const request = http.getRequest<RequestWithId>();
		const response = http.getResponse<Response>();
		const statusCode = getStatusCode(exception);
		const payload = getExceptionPayload(exception);

		logException(this.logger, exception, statusCode, request);

		const body: ApiErrorResponse = {
			success: false,
			statusCode,
			code: payload.code ?? getErrorCode(statusCode),
			message: getErrorMessage(exception, payload, statusCode),
			requestId: request.requestId ?? 'req_unknown',
			timestamp: new Date().toISOString(),
			path: getRequestPath(request),
			method: request.method,
			...(payload.errors ? { errors: payload.errors } : {}),
		};

		logRequest(request, statusCode, statusCode >= 500 ? 'error' : 'warn');
		response.status(statusCode).json(body);
	}
}

/**
 * Logs only server-side failures and unexpected errors with a request ID for
 * correlation. Client errors (4xx) are intentionally not logged to keep the
 * stream free of expected noise. Never logs bodies, headers, or credentials.
 */
function logException(
	logger: Logger,
	exception: unknown,
	statusCode: number,
	request: RequestWithId,
): void {
	const requestId = request.requestId ?? 'req_unknown';
	if (exception instanceof HttpException) {
		if (statusCode >= 500) {
			const payload = getExceptionPayload(exception);
			logger.error(
				`${requestId} ${statusCode} ${payload.message ?? exception.message}`,
				exception.stack,
			);
		}
		return;
	}

	logger.error(
		`${requestId} ${statusCode} ${exception instanceof Error ? exception.message : String(exception)}`,
		exception instanceof Error ? exception.stack : undefined,
	);
}

function getStatusCode(exception: unknown): number {
	return exception instanceof HttpException
		? exception.getStatus()
		: HttpStatus.INTERNAL_SERVER_ERROR;
}

function getExceptionPayload(exception: unknown): HttpExceptionPayload {
	if (!(exception instanceof HttpException)) {
		return {};
	}

	const response = exception.getResponse();

	if (typeof response === 'string') {
		return { message: response };
	}

	return isRecord(response) ? response : {};
}

function getErrorMessage(
	exception: unknown,
	payload: HttpExceptionPayload,
	statusCode: number,
): string {
	if (statusCode === HttpStatus.INTERNAL_SERVER_ERROR && !(exception instanceof HttpException)) {
		return 'Internal server error';
	}

	if (typeof payload.message === 'string') {
		return payload.message;
	}

	if (Array.isArray(payload.message) && payload.message.length > 0) {
		return payload.message.join('; ');
	}

	if (typeof payload.error === 'string') {
		return payload.error;
	}

	return HttpStatus[statusCode] ?? 'Error';
}

function getErrorCode(statusCode: number): string {
	return HttpStatus[statusCode] ?? 'ERROR';
}

function getRequestPath(request: Request): string {
	return request.originalUrl || request.url;
}

function isRecord(value: unknown): value is HttpExceptionPayload {
	return typeof value === 'object' && value !== null;
}
