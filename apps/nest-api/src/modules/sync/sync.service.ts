import { BadRequestException, Injectable } from '@nestjs/common';

import type { SyncRecordRow } from '@/database/schema';
import {
	MAX_CLOCK_SKEW_MS,
	PULL_PAGE,
	type SyncRecordView,
	type SyncRequestInput,
	type SyncResponse,
} from './sync.dto';
import { SyncRepository } from './sync.repository';

@Injectable()
export class SyncService {
	constructor(private readonly repository: SyncRepository) {}

	async sync(
		userId: string,
		request: SyncRequestInput,
		now: number = Date.now(),
	): Promise<SyncResponse> {
		const latest = now + MAX_CLOCK_SKEW_MS;
		if (request.changes.some((change) => change.updatedAt > latest)) {
			throw new BadRequestException({
				code: 'SYNC_CLOCK_AHEAD',
				message: 'A change is dated more than a day in the future; check the device clock',
			});
		}
		assertUnique(request);

		const cursor = request.cursor === null ? 0 : Number(request.cursor);
		const result = await this.repository.pushAndPull(userId, request.changes, cursor, PULL_PAGE);
		const last = result.changes.at(-1);
		return {
			cursor: String(last ? last.seq : cursor),
			changes: result.changes.map(toView),
			conflicts: result.conflicts.map(toView),
			hasMore: result.hasMore,
		};
	}
}

function assertUnique(request: SyncRequestInput): void {
	const keys = new Set<string>();
	for (const change of request.changes) {
		const key = `${change.collection}/${change.id}`;
		if (keys.has(key)) {
			throw new BadRequestException({
				code: 'SYNC_DUPLICATE_RECORD',
				message: `The same record was pushed twice: ${key}`,
			});
		}
		keys.add(key);
	}
}

function toView(row: SyncRecordRow): SyncRecordView {
	return {
		collection: row.collection,
		id: row.id,
		data: row.data,
		updatedAt: row.updatedAt,
		deletedAt: row.deletedAt,
	};
}
