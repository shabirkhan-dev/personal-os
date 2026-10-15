import type { ColorTokens } from "@personal-os/tokens";
import type { HomeHero } from "@/modules/home/lib/module-home";
import { hhmm, PRAYER_LABELS, type Phase } from "../lib/prayer-times";
import { useFaithUi } from "./faith-ui-store";
import { useFaithToday } from "./use-faith-today";

/** The Sky header's light for each part of the day (Figma: Fajr blue, day green, Maghrib gold). */
export const PHASE_GLOW: Record<Phase, keyof ColorTokens> = {
	fajr: "accentDefault",
	day: "statusSuccess",
	maghrib: "statusCaution",
	isha: "borderStrong",
};

/** "Faith · prayers today / 1 of 3", with the header glow following the time of day. */
export function useFaithHero(): HomeHero {
	const { data, rows, prayed, phase } = useFaithToday();
	const openSheet = useFaithUi((state) => state.openSheet);
	const total = data.settings.setUp ? rows.length : data.settings.prayers.length;
	return {
		label: "Faith · prayers today",
		value: String(prayed),
		faint: ` of ${total}`,
		hideable: true,
		glow: PHASE_GLOW[phase],
		onLabelPress: () => openSheet(data.settings.setUp ? "reminders" : "setup"),
	};
}

/** The Overview line for Faith: "Next · Maghrib at 17:38" or "All prayed today". */
export function useFaithStatus(): string {
	const { data, rows, next, prayed } = useFaithToday();
	if (!data.settings.setUp) return "Set up your prayers";
	if (rows.length > 0 && prayed === rows.length) return "All prayed today";
	return next
		? `Next · ${PRAYER_LABELS[next.prayer]} at ${hhmm(next.at)}`
		: `${prayed} of ${rows.length} today`;
}
