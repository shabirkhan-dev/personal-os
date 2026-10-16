import type { HomeHero } from "@/modules/home/lib/module-home";
import { dailyRoutes } from "../navigation";
import { useDailyToday } from "./use-daily";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Today · Fri 16 Oct · minimum day / 3 of 5". */
export function useDailyHero(): HomeHero {
	const { data, kept, total, now } = useDailyToday();
	if (!data.settings.setUp) {
		return {
			label: "Daily life · minimum day",
			value: "–",
			faint: " not set",
			hideable: true,
			onLabelPress: dailyRoutes.minimum,
		};
	}
	return {
		label: `Today · ${DAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]} · minimum day`,
		value: String(kept),
		faint: ` of ${total}`,
		hideable: true,
		onLabelPress: dailyRoutes.minimum,
	};
}

/** The Overview line for Daily life. */
export function useDailyStatus(): string {
	const { data, kept, total, current: next } = useDailyToday();
	if (!data.settings.setUp) return "Choose your minimum day";
	if (total > 0 && kept >= total) return "Minimum day kept";
	return next
		? `${kept} of ${total} · next ${next.item.title.toLowerCase()}`
		: `${kept} of ${total} kept`;
}
