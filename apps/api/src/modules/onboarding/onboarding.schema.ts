import * as z from "zod";

const minuteOfDay = z.number().int().min(0).max(1439);
const goalId = z.enum([
	"lose-weight",
	"build-muscle",
	"save-money",
	"clear-skin",
	"sleep-better",
	"eat-healthy",
	"stay-organized",
	"less-stress",
]);
const moduleId = z.enum([
	"daily-life",
	"career",
	"workout",
	"finance",
	"skincare",
	"food",
	"fashion",
]);

/** Mirrors `OnboardingAnswers` in `apps/mobile/src/modules/onboarding/store/onboarding-store.ts`. */
export const onboardingAnswersSchema = z
	.object({
		path: z.enum(["talk", "steps"]),
		name: z.string().trim().max(80),
		gender: z.enum(["male", "female", "other"]).nullable(),
		birthday: z
			.object({
				day: z.number().int().min(1).max(31),
				month: z.number().int().min(1).max(12),
				year: z.number().int().min(1900).max(2100),
			})
			.strict(),
		heightCm: z.number().min(50).max(260),
		weightKg: z.number().min(20).max(400),
		heightUnit: z.enum(["cm", "ft"]),
		weightUnit: z.enum(["kg", "lb"]),
		wakeMinutes: minuteOfDay,
		bedMinutes: minuteOfDay,
		workStartMinutes: minuteOfDay,
		workEndMinutes: minuteOfDay,
		workdays: z.array(z.boolean()).length(7),
		workStyle: z.enum(["office", "remote", "hybrid"]),
		goals: z.array(goalId).max(3),
		modules: z.array(moduleId).max(6),
		connections: z
			.object({
				calendar: z.boolean(),
				smartwatch: z.boolean(),
				"bank-sms": z.boolean(),
				microphone: z.boolean(),
			})
			.strict(),
		appleHealth: z.boolean(),
		heyOs: z.boolean(),
		reminders: z
			.object({
				"morning-plan": z.boolean(),
				"evening-check-in": z.boolean(),
				"workout-nudge": z.boolean(),
				"bill-reminders": z.boolean(),
			})
			.strict(),
		completed: z.boolean(),
	})
	.strict();

export const saveOnboardingSchema = z.object({ answers: onboardingAnswersSchema }).strict();

export type OnboardingAnswers = z.infer<typeof onboardingAnswersSchema>;

export type OnboardingView = {
	answers: OnboardingAnswers;
	schemaVersion: number;
	updatedAt: string;
};
