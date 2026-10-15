import { settings } from "@/config/settings";
import { AppError } from "@/core/app-error";
import type { Database } from "@/db/client";
import type { SyncRecordRow } from "@/db/schema";
import { pushAndPull } from "./sync.repository";
import type { SyncRecordView, SyncRequest, SyncResponse } from "./sync.schema";

/** One round: push the phone's changes, pull what changed after its cursor (paged). */
export async function sync(
	db: Database,
	userId: string,
	request: SyncRequest,
	now = Date.now(),
): Promise<SyncResponse> {
	const latest = now + settings.sync.maxClockSkewMs;
	if (request.changes.some((change) => change.updatedAt > latest)) {
		throw new AppError("SYNC_CLOCK_AHEAD");
	}
	const keys = new Set(request.changes.map((change) => `${change.collection}/${change.id}`));
	if (keys.size !== request.changes.length) throw new AppError("SYNC_DUPLICATE_RECORD");

	const cursor = request.cursor === null ? 0 : Number(request.cursor);
	const result = await pushAndPull(db, userId, request.changes, cursor, settings.sync.pullPage);
	const last = result.changes.at(-1);
	return {
		cursor: String(last ? last.seq : cursor),
		changes: result.changes.map(toView),
		conflicts: result.conflicts.map(toView),
		hasMore: result.hasMore,
	};
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
