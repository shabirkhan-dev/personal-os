import { clockOf } from "@/modules/home/lib/module-day";
import type { TodayItem } from "@/modules/home/lib/today";
import { moduleOptions } from "@/modules/onboarding/lib/options";
import type { AgendaItem } from "./daily-math";

/** "Faith · 15 min" → "15 min": the module is already shown by the icon. */
function metaOf(detail: string): string {
	const [, ...rest] = detail.split(" · ");
	return rest.length > 0 ? rest.join(" · ") : detail;
}

/**
 * Today's agenda as Overview's Upcoming rows: the live plan Daily life shows (saved, or drafted
 * from the modules), with finished and postponed blocks left out.
 */
export function agendaRows(agenda: readonly AgendaItem[], later: readonly string[]): TodayItem[] {
	return agenda
		.filter((item) => !item.done && !later.includes(item.id))
		.map((item) => {
			const option = moduleOptions.find((candidate) => candidate.id === item.module);
			return {
				id: item.id,
				minutes: item.minutes,
				time: clockOf(item.minutes),
				title: item.title,
				meta: metaOf(item.detail),
				icon: option?.icon ?? "Filled/Grid",
				tone: option?.iconTone ?? "accentDefault",
			};
		});
}
