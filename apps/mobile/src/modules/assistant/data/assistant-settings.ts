import {
	ASSISTANT_SETTINGS_COLLECTION,
	type ApprovalMode,
	defaultAssistantSettings,
	parseAssistantSettings,
} from "@personal-os/domain/assistant";
import { defineCollection, saveItem, useCollection } from "@/lib/db/collection";

/**
 * The assistant's settings, a synced record like any other, so the server reads the same choice
 * the person made on the phone. The name is part of the sync contract: never rename it.
 */
export const assistantSettings = defineCollection(
	ASSISTANT_SETTINGS_COLLECTION,
	parseAssistantSettings,
);

export function useAssistantSettings() {
	const query = useCollection(assistantSettings);
	return { loading: query.isPending, settings: query.data?.[0] ?? defaultAssistantSettings };
}

export function setApproval(approval: ApprovalMode): Promise<void> {
	return saveItem(assistantSettings, { id: "settings", approval });
}
