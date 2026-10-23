import { useMemo } from "react";
import { UpcomingList } from "@/modules/home/components/upcoming-list";
import { minutesOf } from "@/modules/home/lib/module-day";
import { nowLabel, upcoming } from "@/modules/home/lib/today";
import type { ModuleId } from "@/modules/onboarding/lib/options";
import { toggleTick } from "../data/daily-actions";
import { useDailyToday } from "../hooks/use-daily";
import { MINIMUM, minimumState } from "../lib/daily-math";
import { agendaRows } from "../lib/overview";
import { dailyRoutes } from "../navigation";
import { MinimumCard, type MinimumRing } from "./daily-cards";

export type DailyOverviewProps = {
	/** Opens a module's Home on Today. */
	onOpen: (module: ModuleId) => void;
};

/**
 * Overview's view of the day, from the same live data as Daily life: the minimum day (once it is
 * set up) and Upcoming from today's agenda, so Overview and Daily never disagree.
 */
export function DailyOverview({ onOpen }: DailyOverviewProps) {
	const { data, sources, now, today, log, agenda, streak } = useDailyToday();
	const { settings } = data;
	const minute = minutesOf(now);
	const next = useMemo(
		() => upcoming(agendaRows(agenda, log?.later ?? []), minute),
		[agenda, log, minute],
	);

	const showMinimum = !data.loading && settings.setUp && sources.modules.includes("daily-life");
	const rings: MinimumRing[] = settings.minimum.map((id) => ({
		id,
		label: MINIMUM[id].label,
		module: MINIMUM[id].module,
		state: minimumState(id, sources, log),
	}));

	const onRing = (ring: MinimumRing) => {
		if (ring.module !== "daily-life") {
			onOpen(ring.module);
			return;
		}
		toggleTick(today, ring.id).catch((error: unknown) =>
			console.error("[daily] could not tick the minimum day from Overview", error),
		);
	};

	return (
		<>
			{showMinimum ? (
				<MinimumCard rings={rings} streak={streak} onPress={dailyRoutes.minimum} onRing={onRing} />
			) : null}
			<UpcomingList upcoming={next} now={nowLabel(now)} />
		</>
	);
}
