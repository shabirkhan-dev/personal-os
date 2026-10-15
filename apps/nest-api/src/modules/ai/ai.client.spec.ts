import {
	BadGatewayException,
	BadRequestException,
	ServiceUnavailableException,
	UnprocessableEntityException,
} from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AppConfigService } from '@/config/app-config.service';
import { AiClient } from './ai.client';

const config = { aiApiUrl: 'http://ai.test', aiServiceToken: 'token' } as AppConfigService;

function respond(status: number, body: unknown) {
	return vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
}

describe('AiClient.careerTask', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('forwards the task with the service token and returns the result', async () => {
		const fetchMock = respond(200, { subject: 'Hi', body: 'Hello' });
		vi.stubGlobal('fetch', fetchMock);
		await expect(
			new AiClient(config).careerTask('user-1', 'nudge', { company: 'x' }),
		).resolves.toEqual({
			subject: 'Hi',
			body: 'Hello',
		});
		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(url).toBe('http://ai.test/api/v1/career/nudge');
		expect(new Headers(init.headers).get('X-AI-Service-Token')).toBe('token');
		expect(new Headers(init.headers).get('X-User-Id')).toBe('user-1');
	});

	it('maps an unreadable link to 422 with its code', async () => {
		vi.stubGlobal(
			'fetch',
			respond(422, {
				detail: { code: 'JOB_LINK_UNREADABLE', message: 'The page needs a sign-in' },
			}),
		);
		await expect(
			new AiClient(config).careerTask('u', 'read-job', { url: 'https://x.test' }),
		).rejects.toBeInstanceOf(UnprocessableEntityException);
	});

	it('maps other validation failures to 400, upstream errors to 502 and outages to 503', async () => {
		vi.stubGlobal('fetch', respond(422, { detail: [{ msg: 'field required' }] }));
		await expect(new AiClient(config).careerTask('u', 'nudge', {})).rejects.toBeInstanceOf(
			BadRequestException,
		);

		vi.stubGlobal('fetch', respond(502, { detail: { code: 'AI_INVALID_OUTPUT', message: 'bad' } }));
		await expect(new AiClient(config).careerTask('u', 'nudge', {})).rejects.toBeInstanceOf(
			BadGatewayException,
		);

		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
		await expect(new AiClient(config).careerTask('u', 'nudge', {})).rejects.toBeInstanceOf(
			ServiceUnavailableException,
		);
	});

	it('rejects a response that is not an object', async () => {
		vi.stubGlobal('fetch', respond(200, ['not', 'an', 'object']));
		await expect(new AiClient(config).careerTask('u', 'nudge', {})).rejects.toBeInstanceOf(
			BadGatewayException,
		);
	});
});
