import { Injectable } from '@nestjs/common';

import { AiClient } from './ai.client';
import type { AssistRequestInput, AssistResponse, CareerTask } from './ai.dto';

@Injectable()
export class AiService {
	constructor(private readonly client: AiClient) {}

	assist(userId: string, body: AssistRequestInput): Promise<AssistResponse> {
		return this.client.assist(userId, body);
	}

	careerTask(
		userId: string,
		task: CareerTask,
		body: Record<string, unknown>,
	): Promise<Record<string, unknown>> {
		return this.client.careerTask(userId, task, body);
	}

	status(): Promise<{ ok: boolean; provider?: string }> {
		return this.client.health();
	}
}
