import * as z from "zod";

/** The Daily life AI contract: designing a day from the person's notes and what's already fixed. */

export const planModules = [
	"faith",
	"career",
	"food",
	"workout",
	"skincare",
	"finance",
	"fashion",
	"daily-life",
] as const;

const text = (max: number) =>
	z
		.string()
		.default("")
		.transform((value) => value.trim().slice(0, max));
const clock = z.number().int().min(0).max(1439);

export const designDaySchema = z
	.object({
		wakeAt: clock,
		bedAt: clock,
		/** What the modules already put in the day (prayers, meals, workouts), to keep or move. */
		blocks: z
			.array(
				z.object({
					minutes: clock,
					length: z.number().int().min(0).max(600),
					title: z.string().trim().min(1).max(60),
					module: z.enum(planModules),
				}),
			)
			.max(40)
			.default([]),
		/** "Gym at 6, study 2 hours, family dinner at 9". */
		notes: z.string().trim().max(400).default(""),
	})
	.strict();

export const dayDraft = z.object({
	blocks: z
		.array(
			z.object({
				minutes: z.number().int().min(0).max(1439).catch(0),
				length: z.number().int().min(0).max(600).catch(30),
				title: text(60),
				detail: text(80),
				module: z.enum(planModules).catch("daily-life"),
			}),
		)
		.default([])
		.transform((items) =>
			items
				.filter((item) => item.title)
				.toSorted((a, b) => a.minutes - b.minutes)
				.slice(0, 30),
		),
	note: text(240),
});

export type DesignDayInput = z.infer<typeof designDaySchema>;
export type DayDraft = z.infer<typeof dayDraft>;
