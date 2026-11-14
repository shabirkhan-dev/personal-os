import { Platform } from "react-native";
import { listItems } from "@/lib/db/collection";
import { defaultAssistantSettings } from "@personal-os/domain/assistant";
import { assistantSettings } from "@/modules/assistant/data/assistant-settings";
import { planNudges } from "@/modules/assistant/lib/nudges";
import { scheduleNudges } from "@/modules/assistant/services/assistant-nudges";
import { applications } from "@/modules/career/data/collections";
import { careSteps } from "@/modules/care/data/collections";
import { dailySettings } from "@/modules/daily/data/collections";
import { defaultSettings as defaultDailySettings } from "@/modules/daily/lib/daily-model";
import { scheduleDailyAlarms } from "@/modules/daily/services/daily-alarms";
import { faithSettings } from "@/modules/faith/data/collections";
import {
	defaultSettings as defaultFaithSettings,
	timesSource,
} from "@/modules/faith/lib/faith-math";
import { dayTimes, slots } from "@/modules/faith/lib/prayer-times";
import { schedulePrayerReminders } from "@/modules/faith/services/prayer-reminders";
import { financeBills } from "@/modules/finance/data/collections";
import { healthDoses, healthMedicines } from "@/modules/health/data/collections";
import { scheduleMedicineReminders } from "@/modules/health/services/medicine-reminders";
import { reminderPlans } from "@/modules/onboarding/lib/reminders";
import { scheduleReminders } from "@/modules/onboarding/services/reminders.service";
import { loadAnswers } from "@/modules/onboarding/store/answers-storage";
import { loadReminderSettings } from "../data/collections";
import { carePlans, waterPlans } from "../lib/reminder-plan";
import { syncGroup } from "./reminder-engine";

/**
 * Plans every reminder from what is saved on the phone, without any screen open. Runs when the
 * app opens or comes back, when the data behind a reminder changes, and from the background
 * task, so prayers and follow-ups never run out. Each group stands alone: one failing doesn't
 * stop the rest.
 */

type Job = { name: string; run: () => Promise<unknown> };

export async function fajrMinutesFor(day: Date): Promise<number | null> {
	const settings = (await listItems(faithSettings))[0] ?? defaultFaithSettings();
	if (!settings.setUp) return null;
	const fajr = slots(dayTimes(timesSource(settings), day), ["fajr"])[0];
	return fajr ? fajr.at.getHours() * 60 + fajr.at.getMinutes() : null;
}

export function rescheduleCareAndWater(): Promise<unknown> {
	return Promise.all([
		Promise.all([loadReminderSettings(), listItems(careSteps)]).then(([settings, steps]) =>
			syncGroup("care", carePlans(settings, steps.length > 0)),
		),
		loadReminderSettings().then((settings) => syncGroup("water", waterPlans(settings))),
	]);
}

const JOBS: Job[] = [
	{
		name: "prayers",
		run: async () =>
			schedulePrayerReminders((await listItems(faithSettings))[0] ?? defaultFaithSettings()),
	},
	{
		name: "daily alarms",
		run: async () => {
			const now = new Date();
			const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
			const settings = (await listItems(dailySettings))[0] ?? defaultDailySettings();
			return scheduleDailyAlarms(settings, await fajrMinutesFor(tomorrow), now);
		},
	},
	{
		name: "medicines",
		run: async () =>
			scheduleMedicineReminders(await listItems(healthMedicines), await listItems(healthDoses)),
	},
	{ name: "care and water", run: rescheduleCareAndWater },
	{
		name: "setup reminders",
		run: async () => {
			const answers = await loadAnswers();
			return answers ? scheduleReminders(reminderPlans(answers)) : 0;
		},
	},
	{
		name: "assistant",
		run: async () => {
			const [settings, bills, apps] = await Promise.all([
				listItems(assistantSettings),
				listItems(financeBills),
				listItems(applications),
			]);
			return scheduleNudges(
				planNudges({
					settings: settings[0] ?? defaultAssistantSettings,
					bills,
					applications: apps,
					now: new Date(),
				}),
			);
		},
	},
];

let running: Promise<void> | null = null;

export function rescheduleAll(): Promise<void> {
	if (Platform.OS === "web") return Promise.resolve();
	running ??= Promise.all(
		JOBS.map((job) =>
			job.run().catch((error: unknown) => {
				console.warn(`[reminders] could not plan ${job.name}`, error);
			}),
		),
	)
		.then(() => undefined)
		.finally(() => {
			running = null;
		});
	return running;
}
