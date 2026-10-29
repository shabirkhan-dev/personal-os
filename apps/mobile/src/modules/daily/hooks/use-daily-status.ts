import { useDailyToday } from "./use-daily";

/** The Overview line for Daily life. */
export function useDailyStatus(): string {
	const { data, kept, total, current: next } = useDailyToday();
	if (!data.settings.setUp) return "Choose your minimum day";
	if (total > 0 && kept >= total) return "Minimum day kept";
	return next
		? `${kept} of ${total} · next ${next.item.title.toLowerCase()}`
		: `${kept} of ${total} kept`;
}
