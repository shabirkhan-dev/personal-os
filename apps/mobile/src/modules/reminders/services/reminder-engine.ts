import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { prepareNotifications } from "@/modules/onboarding/services/reminders.service";
import { loadReminderSettings } from "../data/collections";
import { type Planned, type ReminderAction, withinBudget } from "../lib/reminder-plan";
import { nextFire } from "./reminder-engine-math";

/**
 * The one place reminders are scheduled. Each group (prayers, medicines…) is replaced as a whole
 * whenever its plan changes, one group at a time so two screens can never double it up.
 *
 * Why reminders arrive on time:
 * - Important groups go out as Android alarm clocks (`delivery: "alarmClock"`), which battery
 *   savers leave alone, once the person allows exact alarms (see `reliability`).
 * - Phone restarts: expo-notifications puts every alarm back after boot.
 * - Times that move (prayers) are planned days ahead and topped up when the app opens and by a
 *   background task, so they don't run out when the app stays closed for a while.
 * - Medicines ask again if a dose isn't marked, and every reminder can be snoozed.
 */

export type ReminderGroup =
	| "reminder"
	| "prayer"
	| "daily"
	| "medicine"
	| "care"
	| "water"
	| "assistant"
	| "snooze";

type Channel = { id: string; name: string; importance: Notifications.AndroidImportance };

const HIGH = Notifications.AndroidImportance.HIGH;
const DEFAULT = Notifications.AndroidImportance.DEFAULT;

/** Channel ids are kept from earlier versions: Android never changes a channel once created. */
const CHANNELS: Record<ReminderGroup, Channel> = {
	reminder: { id: "reminders", name: "Reminders", importance: DEFAULT },
	prayer: { id: "prayers", name: "Prayer reminders", importance: HIGH },
	daily: { id: "daily", name: "Daily alarms", importance: HIGH },
	medicine: { id: "medicines", name: "Medicine reminders", importance: HIGH },
	care: { id: "care", name: "Care routines", importance: HIGH },
	water: { id: "water", name: "Water", importance: DEFAULT },
	assistant: { id: "assistant", name: "Assistant", importance: DEFAULT },
	snooze: { id: "snoozed", name: "Snoozed reminders", importance: HIGH },
};

/** iOS keeps at most 64 pending notifications for an app; each group gets a share. */
const IOS_BUDGET: Record<ReminderGroup, number> = {
	reminder: 6,
	prayer: 24,
	daily: 4,
	medicine: 14,
	care: 2,
	water: 6,
	assistant: 4,
	snooze: 4,
};

export const kindOf = (group: ReminderGroup) => `personal-os.${group}`;

const CATEGORY: Record<ReminderAction, string> = {
	medicine: "po-medicine",
	water: "po-water",
	snooze: "po-snooze",
};

let categoriesReady: Promise<void> | null = null;

/** Buttons on the notification. They work with the app closed (see `reminder-actions`). */
function ensureCategories(snoozeMinutes: number): Promise<void> {
	if (Platform.OS === "web") return Promise.resolve();
	categoriesReady ??= (async () => {
		const snooze = {
			identifier: "snooze",
			buttonTitle: `Snooze ${snoozeMinutes} min`,
			options: { opensAppToForeground: false },
		};
		await Notifications.setNotificationCategoryAsync(CATEGORY.medicine, [
			{ identifier: "taken", buttonTitle: "Taken", options: { opensAppToForeground: false } },
			snooze,
		]);
		await Notifications.setNotificationCategoryAsync(CATEGORY.water, [
			{ identifier: "glass", buttonTitle: "Log a glass", options: { opensAppToForeground: false } },
			snooze,
		]);
		await Notifications.setNotificationCategoryAsync(CATEGORY.snooze, [snooze]);
	})().catch((error: unknown) => {
		categoriesReady = null;
		throw error;
	});
	return categoriesReady;
}

/** The snooze button's label carries the minutes, so a new choice re-creates the buttons. */
export function resetCategories(): void {
	categoriesReady = null;
}

async function ensureChannel(group: ReminderGroup): Promise<void> {
	if (Platform.OS !== "android") return;
	const channel = CHANNELS[group];
	await Notifications.setNotificationChannelAsync(channel.id, {
		name: channel.name,
		importance: channel.importance,
		sound: "default",
		vibrationPattern: channel.importance === HIGH ? [0, 250, 250, 250] : undefined,
		lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
	});
}

function trigger(
	plan: Planned,
	channelId: string,
	delivery: Notifications.NotificationDelivery,
): Notifications.NotificationTriggerInput {
	if ("at" in plan.when) {
		return {
			type: Notifications.SchedulableTriggerInputTypes.DATE,
			date: plan.when.at,
			channelId,
			delivery,
		};
	}
	if ("daily" in plan.when) {
		return {
			type: Notifications.SchedulableTriggerInputTypes.DAILY,
			...plan.when.daily,
			channelId,
			delivery,
		};
	}
	return {
		type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
		...plan.when.weekly,
		channelId,
		delivery,
	};
}

export function content(
	group: ReminderGroup,
	plan: Planned,
): Notifications.NotificationContentInput {
	return {
		title: plan.title,
		body: plan.body,
		sound: "default",
		...(plan.actions ? { categoryIdentifier: CATEGORY[plan.actions] } : {}),
		data: {
			kind: kindOf(group),
			group,
			reminder: plan.id,
			critical: plan.critical,
			...(plan.url ? { url: plan.url } : {}),
			...(plan.actions ? { actions: plan.actions } : {}),
			...plan.data,
		},
	};
}

const queues = new Map<ReminderGroup, Promise<unknown>>();
const lastPlans = new Map<ReminderGroup, string>();

function signature(plans: readonly Planned[], exact: boolean, snooze: number): string {
	return JSON.stringify([
		exact,
		snooze,
		plans.map((plan) => [plan.id, plan.title, plan.body, JSON.stringify(plan.when), plan.url]),
	]);
}

/**
 * Replaces a group's scheduled reminders with `plans`. Returns how many are scheduled (0 without
 * notification permission). Runs after any earlier sync of the same group.
 */
export function syncGroup(group: ReminderGroup, plans: readonly Planned[]): Promise<number> {
	if (Platform.OS === "web") return Promise.resolve(0);
	const previous = queues.get(group) ?? Promise.resolve();
	const run = previous.then(() => replaceGroup(group, plans));
	queues.set(
		group,
		run.catch(() => undefined),
	);
	return run;
}

async function replaceGroup(group: ReminderGroup, all: readonly Planned[]): Promise<number> {
	const settings = await loadReminderSettings();
	const plans = Platform.OS === "ios" ? withinBudget(all, IOS_BUDGET[group]) : [...all];
	const key = signature(plans, settings.exact, settings.snoozeMinutes);
	const { granted } = await Notifications.getPermissionsAsync();
	if (granted && lastPlans.get(group) === key) return plans.length;

	await prepareNotifications();
	await ensureCategories(settings.snoozeMinutes);
	await ensureChannel(group);
	const scheduled = await Notifications.getAllScheduledNotificationsAsync();
	await Promise.all(
		scheduled
			.filter((request) => request.content.data?.kind === kindOf(group))
			.map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)),
	);
	if (!granted) {
		lastPlans.delete(group);
		return 0;
	}
	const channelId = CHANNELS[group].id;
	await Promise.all(
		plans.map((plan) => {
			const delivery = settings.exact && plan.critical ? "alarmClock" : "bestEffort";
			return Notifications.scheduleNotificationAsync({
				identifier: `${kindOf(group)}.${plan.id}`,
				content: content(group, plan),
				trigger: trigger(plan, channelId, delivery),
			});
		}),
	);
	lastPlans.set(group, key);
	return plans.length;
}

/** Forgets what was scheduled, so the next sync of every group writes its plan again. */
export function forgetPlans(): void {
	lastPlans.clear();
}

/** Cancels one reminder of a group (a follow-up once its dose is marked). */
export async function cancelReminder(group: ReminderGroup, id: string): Promise<void> {
	if (Platform.OS === "web") return;
	await Notifications.cancelScheduledNotificationAsync(`${kindOf(group)}.${id}`);
	lastPlans.delete(group);
}

/** The same reminder again in `minutes`, as an alarm when exact timing is on. */
export async function snoozeReminder(
	request: Notifications.NotificationRequest,
	minutes: number,
): Promise<void> {
	const settings = await loadReminderSettings();
	await prepareNotifications();
	await ensureChannel("snooze");
	const data = request.content.data ?? {};
	const at = new Date(Date.now() + minutes * 60_000);
	const delivery = settings.exact ? "alarmClock" : "bestEffort";
	await Notifications.scheduleNotificationAsync({
		identifier: `${kindOf("snooze")}.${request.identifier}.${at.getTime()}`,
		content: {
			title: request.content.title ?? "Reminder",
			body: request.content.body ?? "",
			sound: "default",
			...(request.content.categoryIdentifier
				? { categoryIdentifier: request.content.categoryIdentifier }
				: {}),
			data: { ...data, kind: kindOf("snooze"), snoozedFrom: data.kind ?? null },
		},
		trigger: {
			type: Notifications.SchedulableTriggerInputTypes.DATE,
			date: at,
			channelId: CHANNELS.snooze.id,
			delivery,
		},
	});
}

/** A test reminder in `seconds`, through the same path as the real ones. */
export async function sendTestReminder(seconds = 10): Promise<boolean> {
	if (Platform.OS === "web") return false;
	const { granted } = await Notifications.getPermissionsAsync();
	if (!granted) return false;
	const settings = await loadReminderSettings();
	await prepareNotifications();
	await ensureCategories(settings.snoozeMinutes);
	await ensureChannel("care");
	await Notifications.scheduleNotificationAsync({
		content: content("snooze", {
			id: "test",
			title: "Reminders work",
			body: "This is how your reminders will look. Try the snooze button.",
			when: { at: new Date() },
			actions: "snooze",
			critical: true,
		}),
		trigger: {
			type: Notifications.SchedulableTriggerInputTypes.DATE,
			date: new Date(Date.now() + seconds * 1000),
			channelId: CHANNELS.care.id,
			delivery: settings.exact ? "alarmClock" : "bestEffort",
		},
	});
	return true;
}

export type Upcoming = { id: string; title: string; at: Date; group: string };

/** The next reminders the phone will show, soonest first. */
export async function upcomingReminders(limit = 8): Promise<{ total: number; next: Upcoming[] }> {
	if (Platform.OS === "web") return { total: 0, next: [] };
	const scheduled = await Notifications.getAllScheduledNotificationsAsync();
	const ours = scheduled.filter((request) =>
		String(request.content.data?.kind ?? "").startsWith("personal-os."),
	);
	const now = new Date();
	const dated = ours.map((request) => {
		const at = nextFire(request.trigger, now);
		return at
			? {
					id: request.identifier,
					title: request.content.title ?? "Reminder",
					at,
					group: String(request.content.data?.group ?? ""),
				}
			: null;
	});
	const next = dated
		.filter((item): item is Upcoming => item !== null)
		.toSorted((a, b) => a.at.getTime() - b.at.getTime())
		.slice(0, limit);
	return { total: ours.length, next };
}
