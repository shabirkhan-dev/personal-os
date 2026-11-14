import * as BackgroundTask from "expo-background-task";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";
import { handleReminderAction } from "./reminder-actions";
import { rescheduleAll } from "./reschedule-all";

/**
 * Background work for reminders, defined when this file loads (the root layout imports it first,
 * so the tasks exist even when the system starts the app in the background):
 * - a periodic task (about every 6 hours, when the system allows) that tops up every reminder
 *   group, so prayers and follow-ups keep going while the app stays closed;
 * - the notification task, which runs the Snooze, Taken and Log a glass buttons with the app
 *   closed (Android).
 */

export const TOP_UP_TASK = "personal-os.reminders.top-up";
export const ACTION_TASK = "personal-os.reminders.action";
const TOP_UP_MINUTES = 6 * 60;

if (Platform.OS !== "web") {
	TaskManager.defineTask(TOP_UP_TASK, async () => {
		try {
			await rescheduleAll();
			return BackgroundTask.BackgroundTaskResult.Success;
		} catch (error) {
			console.error("[reminders] background top-up failed", error);
			return BackgroundTask.BackgroundTaskResult.Failed;
		}
	});

	TaskManager.defineTask<Notifications.NotificationTaskPayload>(
		ACTION_TASK,
		async ({ data, error }) => {
			if (error) {
				console.error("[reminders] notification task error", error);
				return;
			}
			if (data && "actionIdentifier" in data) {
				await handleReminderAction(data);
			}
		},
	);
}

let registered = false;

/** Registers both tasks once per launch; safe to call again. */
export async function registerReminderTasks(): Promise<void> {
	if (Platform.OS === "web" || registered) return;
	registered = true;
	try {
		await Notifications.registerTaskAsync(ACTION_TASK);
		const status = await BackgroundTask.getStatusAsync();
		if (status === BackgroundTask.BackgroundTaskStatus.Available) {
			await BackgroundTask.registerTaskAsync(TOP_UP_TASK, { minimumInterval: TOP_UP_MINUTES });
		}
	} catch (error) {
		registered = false;
		console.error("[reminders] could not register the background tasks", error);
	}
}
