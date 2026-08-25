import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, type Mocked, vi } from 'vitest';

import type { AccessTokenPayload } from '@/modules/auth/auth.types';
import { AiClient } from './ai.client';
import { AiGatewayRepository } from './ai-gateway.repository';
import { AiGatewayService } from './ai-gateway.service';

const userId = 'a1111111-1111-4111-8111-111111111111';
const sessionId = 'b2222222-2222-4222-8222-222222222222';
const payload: AccessTokenPayload = { sub: userId, sid: 'cccccccc-cccc-cccc-cccc-cccccccccccc' };

function sessionRow() {
	return {
		id: sessionId,
		userId,
		title: null,
		contextRoute: null,
		contextEntityType: null,
		contextEntityId: null,
		contextDate: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
}

function messageRow(overrides: Record<string, unknown> = {}) {
	return {
		id: 'd3333333-3333-4333-8333-333333333333',
		sessionId,
		userId,
		role: 'user',
		content: 'hello',
		sources: null,
		suggestions: null,
		provider: null,
		model: null,
		latencyMs: null,
		createdAt: new Date(),
		...overrides,
	};
}

describe('AiGatewayService', () => {
	let repository: Mocked<AiGatewayRepository>;
	let client: Mocked<AiClient>;
	let routines: { getToday: ReturnType<typeof vi.fn> };
	let finance: { getSummary: ReturnType<typeof vi.fn> };
	let service: AiGatewayService;

	beforeEach(() => {
		repository = {
			createSession: vi.fn(async (values) => ({ ...sessionRow(), ...values })),
			findSession: vi.fn(async () => sessionRow()),
			listSessions: vi.fn(async () => []),
			listMessages: vi.fn(async () => []),
			countMessages: vi.fn(async () => 0),
			insertMessage: vi.fn(async (values) => messageRow(values)),
			touchSession: vi.fn(async () => {}),
		} as unknown as Mocked<AiGatewayRepository>;
		client = {
			dailyIntelligence: vi.fn(async () => ({
				insights: [
					{
						id: 'insight-1',
						kind: 'routine',
						priority: 'high',
						title: 'Morning routine at risk',
						detail: '2 of 5 steps done by noon.',
						sourceRefs: [{ type: 'routine', id: 'r1', label: 'Morning routine' }],
					},
				],
				provider: 'mock',
				model: 'mock-model',
			})),
			chat: vi.fn(async () => ({
				reply: 'Here is what I see.',
				provider: 'mock',
				model: 'mock-model',
				sources: [{ type: 'routine', id: 'r1', label: 'Morning routine' }],
				suggestions: [{ title: 'Open today', kind: 'navigation' }],
			})),
		} as unknown as Mocked<AiClient>;
		routines = {
			getToday: vi.fn(async () => ({
				date: '2026-08-24',
				timeZone: 'UTC',
				weekday: 1,
				routines: [],
			})),
		};
		finance = {
			getSummary: vi.fn(async () => ({
				month: '2026-08',
				incomeTotal: 0,
				expenseTotal: 0,
				netTotal: 0,
				categories: [],
			})),
		};
		service = new AiGatewayService(repository, client, routines as never, finance as never);
	});

	it('builds daily intelligence from authorized routines and finance context', async () => {
		const result = await service.getDailyIntelligence(userId);

		expect(routines.getToday).toHaveBeenCalledWith(userId);
		expect(finance.getSummary).toHaveBeenCalledWith(userId, '2026-08');
		expect(client.dailyIntelligence).toHaveBeenCalledWith(
			expect.objectContaining({
				date: '2026-08-24',
				timeZone: 'UTC',
				context: expect.objectContaining({ financeMonth: '2026-08' }),
			}),
		);
		expect(result.insights).toHaveLength(1);
		expect(result.insights[0].sourceRefs).toHaveLength(1);
	});

	it('creates a session with normalized optional context', async () => {
		await service.createSession(userId, {
			title: 'Plans',
			context: { route: '/admin/today', date: '2026-08-24' },
		});
		expect(repository.createSession).toHaveBeenCalledWith(
			expect.objectContaining({
				userId,
				title: 'Plans',
				contextRoute: '/admin/today',
				contextDate: '2026-08-24',
			}),
		);
	});

	it('persists both sides of a conversation and returns the assistant reply', async () => {
		repository.listMessages.mockResolvedValue([
			messageRow({ role: 'user', content: 'hello' }),
			messageRow({
				id: 'd3333333-3333-4333-8333-333333333339',
				role: 'assistant',
				content: 'Hi!',
			}),
		]);

		const result = await service.sendMessage(
			userId,
			sessionId,
			{ message: 'How am I doing?' },
			payload,
		);

		expect(repository.insertMessage).toHaveBeenCalledWith(
			expect.objectContaining({ role: 'user', content: 'How am I doing?' }),
		);
		expect(client.chat).toHaveBeenCalledOnce();
		const call = vi.mocked(client.chat).mock.calls[0][0];
		expect(call.messages.at(-1)).toEqual({ role: 'user', content: 'How am I doing?' });
		expect(call.messages).toHaveLength(3);
		expect(result.message.role).toBe('assistant');
		expect(result.message.latencyMs).toBeTypeOf('number');
		expect(repository.touchSession).toHaveBeenCalledWith(sessionId);
	});

	it('grounds general chat with a minimal authorized snapshot when no context is given', async () => {
		await service.sendMessage(
			userId,
			sessionId,
			{ message: 'What is the capital of France?' },
			payload,
		);

		const call = vi.mocked(client.chat).mock.calls[0][0];
		expect(call.context?.personalOS).toEqual(
			expect.objectContaining({
				date: '2026-08-24',
				finance: expect.objectContaining({ month: '2026-08' }),
			}),
		);
	});

	it('merges per-message context over session context', async () => {
		repository.findSession.mockResolvedValue({
			...sessionRow(),
			contextRoute: '/admin/routines',
			contextEntityType: 'routine',
			contextEntityId: 'e4444444-4444-4444-8444-444444444444',
		});
		repository.listMessages.mockResolvedValue([messageRow()]);

		await service.sendMessage(
			userId,
			sessionId,
			{ message: 'focus on this', context: { route: '/admin/today' } },
			payload,
		);

		const call = vi.mocked(client.chat).mock.calls[0][0];
		expect(call.context?.route).toBe('/admin/today');
		expect(call.context?.entity).toEqual({
			type: 'routine',
			id: 'e4444444-4444-4444-8444-444444444444',
		});
	});

	it('enforces the per-session message limit', async () => {
		repository.countMessages.mockResolvedValue(200);
		await expect(
			service.sendMessage(userId, sessionId, { message: 'one more?' }, payload),
		).rejects.toBeInstanceOf(BadRequestException);
	});

	it('throws when the session does not belong to the user', async () => {
		repository.findSession.mockResolvedValue(null);
		await expect(
			service.sendMessage(userId, sessionId, { message: 'hi' }, payload),
		).rejects.toBeInstanceOf(NotFoundException);
	});
});
