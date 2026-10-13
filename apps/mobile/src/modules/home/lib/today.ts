import type { ColorTokens } from "@personal-os/tokens";
import type { IconName } from "@/components/icons";
import { dayRhythm } from "@/modules/onboarding/lib/insights";
import { type ModuleId, moduleOptions, type ReminderId } from "@/modules/onboarding/lib/options";
import { buildDayPlan, type PlanInput, type PlanRow } from "@/modules/onboarding/lib/plan";
import { formatClock, formatDuration, wrapMinutes } from "@/modules/onboarding/lib/time";

type Tone = keyof ColorTokens;

export type TodayItem = {
	id: string;
	minutes: number;
	time: string;
	title: string;
	meta: string;
	icon: IconName;
	tone: Tone;
};

export type Upcoming = {
	/** The next item, with how long until it starts. */
	next: (TodayItem & { startsIn: string; tomorrow: boolean }) | null;
	/** Up to three items after `next`. */
	later: TodayItem[];
};

const subtleTone: Partial<Record<Tone, Tone>> = {
	statusSuccess: "statusSuccessSubtle",
	statusCaution: "statusCautionSubtle",
	statusDanger: "statusDangerSubtle",
	statusViolet: "statusVioletSubtle",
	accentDefault: "accentSubtle",
};

/** The soft tile colour that pairs with a status colour. */
export function tileToneFor(tone: Tone): Tone {
	return subtleTone[tone] ?? "bgSubtle";
}

function fromPlanRow(row: PlanRow): TodayItem {
	return {
		id: `plan-${row.title}`,
		minutes: row.minutes,
		time: row.time,
		title: row.title,
		meta: row.meta,
		icon: row.icon,
		tone: row.iconTone,
	};
}

/** Today's timeline: the plan from onboarding plus the reminders the user kept on. */
export function todayItems(
	input: PlanInput,
	reminders: Readonly<Record<ReminderId, boolean>>,
): TodayItem[] {
	const rhythm = dayRhythm(input.wakeMinutes, input.bedMinutes);
	const items = buildDayPlan(input).map(fromPlanRow);
	if (reminders["evening-check-in"]) {
		const minutes = wrapMinutes(input.bedMinutes - 30);
		items.push({
			id: "reminder-check-in",
			minutes,
			time: rhythm.checkIn,
			title: "Evening check-in",
			meta: "2 min",
			icon: "Moon",
			tone: "statusSuccess",
		});
	}
	if (reminders["morning-plan"]) {
		const minutes = wrapMinutes(input.wakeMinutes + 15);
		items.push({
			id: "reminder-morning-plan",
			minutes,
			time: rhythm.morningPlan,
			title: "Morning plan",
			meta: "1 min",
			icon: "Sun",
			tone: "statusCaution",
		});
	}
	return items.toSorted((a, b) => a.minutes - b.minutes);
}

/** Splits the timeline around the current minute; after the last item it rolls to tomorrow. */
export function upcoming(items: readonly TodayItem[], nowMinutes: number): Upcoming {
	if (items.length === 0) return { next: null, later: [] };
	const startIndex = items.findIndex((item) => item.minutes > nowMinutes);
	const tomorrow = startIndex === -1;
	const ordered = tomorrow
		? [...items]
		: [...items.slice(startIndex), ...items.slice(0, startIndex)];
	const [first, ...rest] = ordered;
	if (!first) return { next: null, later: [] };
	const wait = tomorrow ? first.minutes + 24 * 60 - nowMinutes : first.minutes - nowMinutes;
	const laterToday = tomorrow ? rest : rest.filter((item) => item.minutes > nowMinutes);
	return {
		next: { ...first, startsIn: formatDuration(wait), tomorrow },
		later: laterToday.slice(0, 3),
	};
}

export type ModuleStatus = {
	id: ModuleId;
	label: string;
	status: string;
	icon: IconName;
	iconTone: Tone;
	tileTone: Tone;
	enabled: boolean;
};

/** One line per module for the picker, built from the plan rather than invented numbers. */
export function moduleStatuses(input: PlanInput, items: readonly TodayItem[]): ModuleStatus[] {
	const find = (title: string) => items.find((item) => item.title === title);
	const statusFor = (id: ModuleId, summary: string): string => {
		switch (id) {
			case "daily-life":
				return `${items.length} things planned today`;
			case "workout": {
				const workout = find("Push day");
				return workout ? `Push day at ${workout.time}` : summary;
			}
			case "skincare": {
				const routine = find("Skincare · PM");
				return routine ? `PM routine at ${routine.time}` : summary;
			}
			case "finance":
				return "Budget not set yet";
			default:
				return summary;
		}
	};
	return moduleOptions.map((option) => ({
		id: option.id,
		label: option.label,
		status: statusFor(option.id, option.summary),
		icon: option.icon,
		iconTone: option.iconTone,
		tileTone: option.tileTone,
		enabled: input.modules.includes(option.id),
	}));
}

/** "PKR · OCT" style period label for the money card. */
export function periodLabel(date: Date, currency = "PKR"): string {
	const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
	return `${currency} · ${month}`;
}

/** "Now 16:20" chip value. */
export function nowLabel(date: Date): string {
	return `Now ${formatClock(date.getHours() * 60 + date.getMinutes())}`;
}
