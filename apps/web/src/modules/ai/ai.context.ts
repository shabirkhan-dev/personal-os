import { z } from "zod";
import type { ChatContext, SourceRef } from "./ai.types";

const entitySchema = z.object({
	type: z.enum(["routine", "routine_item", "finance_transaction", "budget"]),
	id: z.uuid(),
});

export function readChatContext(params: Pick<URLSearchParams, "get">): ChatContext {
	const route = params.get("from");
	const date = params.get("date");
	const entity = entitySchema.safeParse({
		type: params.get("entityType"),
		id: params.get("entityId"),
	});
	return {
		...(route?.startsWith("/") && route.length <= 200 ? { route } : {}),
		...(date && z.iso.date().safeParse(date).success ? { date } : {}),
		...(entity.success ? { entity: entity.data } : {}),
	};
}

export function insightChatQuery(date: string, source?: SourceRef): Record<string, string> {
	const query: Record<string, string> = { from: "/admin/today", date };
	const entity = entitySchema.safeParse(source);
	if (entity.success) {
		query.entityType = entity.data.type;
		query.entityId = entity.data.id;
	}
	return query;
}
