import { Logger } from '@nestjs/common';
import type { Request } from 'express';

import type { RequestWithId } from '@/common/types/request-with-id.type';

const logger = new Logger('HttpAccess');

/** Paths that are intentionally excluded from per-request logging to cut noise. */
const SKIPPED_PATHS = ['/health', '/docs'];

export function logRequest(
	request: RequestWithId | Request,
	statusCode: number,
	level: 'info' | 'warn' | 'error' = 'info',
): void {
	const path = request.originalUrl || request.url || '/';
	if (SKIPPED_PATHS.some((skipped) => path.startsWith(skipped))) {
		return;
	}

	const requestId = (request as RequestWithId).requestId ?? 'req_unknown';
	const durationMs = durationOf((request as RequestWithId).startedAt);

	const line = `${request.method} ${path} ${statusCode} ${durationMs}ms ${requestId}`;
	if (level === 'error') logger.error(line);
	else if (level === 'warn') logger.warn(line);
	else logger.log(line);
}

function durationOf(startedAt: number | undefined): number {
	return startedAt ? Math.max(0, Date.now() - startedAt) : 0;
}
