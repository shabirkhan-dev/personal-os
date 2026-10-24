import { dayKey } from "@/lib/day";
import type { Activity } from "@/modules/workout/lib/activities";
import { type Template, templateById } from "@/modules/workout/lib/library";
import {
	buildProgramWeek,
	mondayOf,
	programById,
	resolveTemplate,
	weekKind,
	weekNumber,
} from "@/modules/workout/lib/programs/engine";
import type { ProgramDef, Progress } from "@/modules/workout/lib/programs/program-model";
import { sessionFor } from "@/modules/workout/lib/training-math";
import type {
	PlanSlot,
	Session,
	TrainingSettings,
	WeekPlan,
} from "@/modules/workout/lib/training-model";
import { addDays } from "@/lib/day";
import { type CalendarItem, daysBetween, SOURCE_TONES } from "./calendar-model";

export type TrainingCalendarInput = {
	settings: TrainingSettings;
	plans: readonly WeekPlan[];
	sessions: readonly Session[];
	programs: readonly ProgramDef[];
	progress: ReadonlyMap<string, Progress>;
	activities: readonly Activity[];
};

const KIND_LABELS = { build: "Build week", deload: "Light week", test: "Test week" } as const;

/**
 * Training on the calendar: sessions done, sessions planned (the saved week, or the program's week
 * ahead when it isn't planned yet), and each program week as a range with its kind.
 */
export function trainingItems(
	input: TrainingCalendarInput,
	from: string,
	to: string,
): CalendarItem[] {
	const { settings, plans, sessions, programs } = input;
	const context = { programs, progress: input.progress, settings, activities: input.activities };
	const resolve = (id: string | null): Template | undefined =>
		id && (id.startsWith("p:") || id.startsWith("a:"))
			? resolveTemplate(id, context)
			: templateById(id);
	const program = programById(programs, settings.program?.id);
	const items: CalendarItem[] = [];
	const tone = SOURCE_TONES.training;

	for (const session of sessions) {
		const date = dayKey(new Date(session.startedAt));
		if (date < from || date > to) continue;
		const started = new Date(session.startedAt);
		items.push({
			id: `session-${session.id}`,
			source: "training",
			date,
			minutes: started.getHours() * 60 + started.getMinutes(),
			title: session.title,
			detail: `Done · ${session.durationMin} min`,
			tone,
			done: true,
			link: { kind: "training-session", id: session.id },
		});
	}

	// Each week in the range: the saved plan, or the program's plan ahead.
	const weeks = new Set(daysBetween(from, to).map(mondayOf));
	for (const monday of weeks) {
		const days = Array.from({ length: 7 }, (_, index) =>
			dayKey(addDays(new Date(`${monday}T12:00:00`), index)),
		);
		const saved = plans.find((plan) => plan.id === monday);
		const number = program && settings.program ? weekNumber(settings.program.startedOn, monday) : 0;
		const running = program !== undefined && number >= 1 && number <= program.weeks;
		const slots: PlanSlot[] =
			saved?.slots ?? (running && program ? buildProgramWeek(program, settings, number, days) : []);
		for (const slot of slots) {
			if (!slot.template || slot.day < from || slot.day > to) continue;
			if (sessionFor(slot, sessions)) continue;
			const template = resolve(slot.template);
			if (!template) continue;
			items.push({
				id: `slot-${slot.day}`,
				source: "training",
				date: slot.day,
				minutes: settings.trainAt,
				title: template.title,
				detail: `${template.short}${template.program ? ` · ${template.program.title}` : ""}`,
				tone,
				link: { kind: "training-plan", template: slot.template },
			});
		}
		if (running && program) {
			const sunday = days[6] ?? monday;
			items.push({
				id: `program-week-${monday}`,
				source: "training",
				date: monday < from ? from : monday,
				endDate: sunday > to ? to : sunday,
				title: `${program.title} · week ${number}`,
				detail: KIND_LABELS[weekKind(program, number)],
				tone,
				link: { kind: "training-program", id: program.id },
			});
		}
	}
	return items;
}
