import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchWithTimeout, isAbortError, UpstreamTimeoutError } from './fetch-with-timeout';

describe('fetchWithTimeout', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('resolves normally when the upstream responds in time', async () => {
		const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);

		const response = await fetchWithTimeout('http://example.com', {}, 5_000);
		expect(response.status).toBe(200);
	});

	it('throws UpstreamTimeoutError when the upstream exceeds the deadline', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockImplementation(
				(_url: string, init: RequestInit) =>
					new Promise<Response>((_resolve, reject) => {
						init.signal?.addEventListener('abort', () =>
							reject(new DOMException('The operation was aborted', 'AbortError')),
						);
					}),
			),
		);

		await expect(fetchWithTimeout('http://example.com', {}, 5)).rejects.toBeInstanceOf(
			UpstreamTimeoutError,
		);
	});

	it('passes through non-abort network errors', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));

		await expect(fetchWithTimeout('http://example.com', {}, 5_000)).rejects.toThrow('fetch failed');
	});

	it('identifies abort and timeout errors', () => {
		expect(isAbortError(new DOMException('aborted', 'AbortError'))).toBe(true);
		expect(isAbortError(new DOMException('timed out', 'TimeoutError'))).toBe(true);
		expect(isAbortError(new UpstreamTimeoutError(10))).toBe(true);
		expect(isAbortError(new Error('nope'))).toBe(false);
	});
});
