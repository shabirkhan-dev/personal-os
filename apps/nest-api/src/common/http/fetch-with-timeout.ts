/** A bounded-timeout fetch whose abort surfaces as a stable, catchable error. */
export class UpstreamTimeoutError extends Error {
	constructor(timeoutMs: number) {
		super(`Upstream request timed out after ${timeoutMs}ms`);
		this.name = 'UpstreamTimeoutError';
	}
}

export function isAbortError(error: unknown): boolean {
	return (
		error instanceof Error &&
		(error.name === 'AbortError' ||
			error.name === 'TimeoutError' ||
			error.name === 'UpstreamTimeoutError')
	);
}

export async function fetchWithTimeout(
	url: string,
	init: RequestInit,
	timeoutMs: number,
): Promise<Response> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		return await fetch(url, { ...init, signal: controller.signal });
	} catch (error) {
		if (isAbortError(error)) throw new UpstreamTimeoutError(timeoutMs);
		throw error;
	} finally {
		clearTimeout(timer);
	}
}

/**
 * Bounds a promise that has no native timeout (e.g. SDK calls). Rejects with
 * `UpstreamTimeoutError` once the deadline passes. Note: the underlying work is
 * not cancelled — only the caller is released.
 */
export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const deadline = new Promise<never>((_resolve, reject) => {
		timer = setTimeout(() => reject(new UpstreamTimeoutError(timeoutMs)), timeoutMs);
	});
	try {
		return await Promise.race([promise, deadline]);
	} finally {
		clearTimeout(timer);
	}
}
