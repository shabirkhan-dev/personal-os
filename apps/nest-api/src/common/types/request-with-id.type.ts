import type { Request } from 'express';

export type RequestWithId = Request & {
	requestId?: string;
	startedAt?: number;
};
