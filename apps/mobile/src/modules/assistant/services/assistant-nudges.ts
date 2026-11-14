import { Platform } from "react-native";
import { syncGroup } from "@/modules/reminders/services/reminder-engine";
import type { Nudge } from "../lib/nudges";

/**
 * The assistant's nudges as local notifications. They are planned on the phone from its own
 * records and replaced whenever the plan changes; tapping one opens the assistant with its
 * question asked (see `useNotificationLinks`).
 */

/** The deep link a nudge opens: the assistant, asked `ask`. */
export function nudgeUrl(ask: string): string {
	return `personalos://assistant?ask=${encodeURIComponent(ask)}`;
}

export function scheduleNudges(nudges: readonly Nudge[]): Promise<number> {
	if (Platform.OS === "web") return Promise.resolve(0);
	return syncGroup(
		"assistant",
		nudges.map((nudge) => ({
			id: nudge.id,
			title: nudge.title,
			body: nudge.body,
			when: "at" in nudge ? { at: nudge.at } : { daily: nudge.daily },
			url: nudgeUrl(nudge.ask),
			actions: "snooze" as const,
			critical: false,
		})),
	);
}
