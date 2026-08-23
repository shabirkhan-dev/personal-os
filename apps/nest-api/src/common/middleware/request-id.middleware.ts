import { randomUUID } from 'node:crypto';

import type { NextFunction, Response } from 'express';

import type { RequestWithId } from '@/common/types/request-with-id.type';

const requestIdHeader = 'x-request-id';

export function requestIdMiddleware(
	request: RequestWithId,
	response: Response,
	next: NextFunction,
): void {
	const inboundRequestId = request.header(requestIdHeader);
	const requestId = isValidRequestId(inboundRequestId) ? inboundRequestId : `req_${randomUUID()}`;

	request.requestId = requestId;
	request.startedAt = Date.now();
	response.setHeader(requestIdHeader, requestId);
	next();
}

/** Only a constrained charset is accepted so arbitrary strings never enter logs. */
function isValidRequestId(value: string | undefined): value is string {
	return typeof value === 'string' && /^[a-zA-Z0-9._:-]{1,64}$/.test(value);
}
