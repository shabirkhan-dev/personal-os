import type { ModuleId, ReminderId } from "./options";

const DAY = 24 * 60;

/** A repeating local notification. Weekday follows expo-notifications: 1 is Sunday. */
export type ReminderPlan = {
	id: ReminderId;
	title: string;
	body: string;
	hour: number;
	minute: number;
	weekdays?: number[];
};

export type ReminderInput = {
	reminders: Record<ReminderId, boolean>;
	modules: readonly ModuleId[];
	wakeMinutes: number;
	bedMinutes: number;
	name: string;
};

function at(minutes: number): { hour: number; minute: number } {
	const value = ((minutes % DAY) + DAY) % DAY;
	return { hour: Math.floor(value / 60), minute: value % 60 };
}

/** Workout nudges go out Monday, Wednesday and Friday at 18:30. */
export const WORKOUT_WEEKDAYS = [2, 4, 6];
const WORKOUT_MINUTES = 18 * 60 + 30;

/**
 * The notifications to schedule for the reminders that are on. Bill reminders need bills, so
 * they wait for the Finance module rather than firing on a guess.
 */
export function reminderPlans(input: ReminderInput): ReminderPlan[] {
	const plans: ReminderPlan[] = [];
	const hello = input.name.trim() ? `, ${input.name.trim()}` : "";
	if (input.reminders["morning-plan"]) {
		plans.push({
			id: "morning-plan",
			title: `Good morning${hello}`,
			body: "Your plan for today is ready.",
			...at(input.wakeMinutes + 15),
		});
	}
	if (input.reminders["evening-check-in"]) {
		plans.push({
			id: "evening-check-in",
			title: "Evening check-in",
			body: "Two minutes: how did today go?",
			...at(input.bedMinutes - 30),
		});
	}
	if (input.reminders["workout-nudge"] && input.modules.includes("workout")) {
		plans.push({
			id: "workout-nudge",
			title: "Time to move",
			body: "Your workout is waiting.",
			...at(WORKOUT_MINUTES),
			weekdays: WORKOUT_WEEKDAYS,
		});
	}
	return plans;
}
