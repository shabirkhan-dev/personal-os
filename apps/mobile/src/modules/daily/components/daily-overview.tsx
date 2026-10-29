import { router } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { ActionPills } from "@/components/module-ui";
import { formatMoney } from "@/lib/money";
import { useCareStatus } from "@/modules/care";
import { useCareerStatus } from "@/modules/career";
import { useFashionDay, useFashionStatus } from "@/modules/fashion";
import { useFaithStatus } from "@/modules/faith";
import { useFinanceSummary } from "@/modules/finance";
import { useFoodStatus } from "@/modules/food";
import { clockOf, minutesOf } from "@/modules/home/lib/module-day";
import type { ModuleId } from "@/modules/onboarding/lib/options";
import { useWorkoutStatus } from "@/modules/workout";
import { pushLater, recordResult, toggleTick } from "../data/daily-actions";
import { useDailyToday } from "../hooks/use-daily";
import { MINIMUM, MODULE_LABELS, minimumState } from "../lib/daily-math";
import type { PlanModule } from "../lib/daily-model";
import { dailyRoutes } from "../navigation";
import { scheduleDailyAlarms } from "../services/daily-alarms";
import {
	AgendaRow,
	Card,
	CardHead,
	MinimumCard,
	type MinimumRing,
	MODULE_TONES,
	type ModuleTile,
	ModuleTiles,
	RightNowCard,
} from "./daily-cards";
import { MinimumPicker } from "./minimum-picker";

const TILE_ORDER: readonly ModuleId[] = [
	"career",
	"faith",
	"workout",
	"food",
	"skincare",
	"finance",
	"fashion",
];

/** How far along a module is today, for its tile's bar. */
function tileShare(
	id: ModuleId,
	extra: ReturnType<typeof useDailyToday>["sources"]["extra"],
	finance: { budget: number | null; spentThisMonth: number },
	worn: boolean,
): number {
	switch (id) {
		case "faith":
			return extra.faith.total ? extra.faith.prayed / extra.faith.total : 0;
		case "career":
			return extra.career.appliedToday / extra.career.dailyTarget;
		case "food":
			return extra.food.kcalTarget ? extra.food.kcal / extra.food.kcalTarget : 0;
		case "skincare":
			return (Number(extra.care.morning.finished) + Number(extra.care.night.finished)) / 2;
		case "workout":
			return Math.min(1, extra.workout.minutesToday / 45);
		case "finance":
			return finance.budget ? Math.min(1, finance.spentThisMonth / finance.budget) : 0;
		case "fashion":
			return worn ? 1 : 0.4;
		default:
			return 0;
	}
}

export type DailyOverviewProps = {
	/** Opens a module's Home on Today. */
	onOpen: (module: ModuleId) => void;
	/** Shows a short message under the ask bar. */
	onNotice: (text: string) => void;
};

/**
 * The day on Overview: plan, close and sleep, what's on right now, the minimum day (when the
 * routine is on), every module's progress today and the rest of the day. It also keeps today's
 * result for the streak and the day's alarms scheduled.
 */
export function DailyOverview({ onOpen, onNotice }: DailyOverviewProps) {
	const {
		data,
		sources,
		now,
		today,
		log,
		agenda,
		current: rightNow,
		kept,
		total,
		streak,
	} = useDailyToday();
	const { settings } = data;
	const finance = useFinanceSummary();
	const fashion = useFashionDay();
	const statuses: Partial<Record<ModuleId, string>> = {
		career: useCareerStatus(),
		faith: useFaithStatus(),
		workout: useWorkoutStatus(),
		food: useFoodStatus(),
		skincare: useCareStatus(),
		fashion: useFashionStatus(),
	};
	const routine = sources.modules.includes("daily-life");
	const failed = (error: unknown) => {
		console.error("[daily] could not save", error);
		onNotice("Couldn't save on this phone. Try again.");
	};

	// Keep today's result, so tomorrow's streak knows how today went.
	useEffect(() => {
		if (data.loading || !settings.setUp) return;
		recordResult(log, today, kept, total)?.catch((error: unknown) =>
			console.error("[daily] could not keep today's result", error),
		);
	}, [data.loading, settings.setUp, log, today, kept, total]);

	const fajr = sources.extra.faith.fajr?.minutes ?? null;
	useEffect(() => {
		if (data.loading) return;
		scheduleDailyAlarms(settings, fajr).catch((error: unknown) =>
			console.warn("[daily] could not schedule alarms", error),
		);
	}, [data.loading, settings, fajr]);

	const open = (module: PlanModule) => {
		if (module === "daily-life") dailyRoutes.sleep();
		else onOpen(module);
	};

	const rings: MinimumRing[] = settings.minimum.map((id) => ({
		id,
		label: MINIMUM[id].label,
		module: MINIMUM[id].module,
		state: minimumState(id, sources, log),
	}));

	const tiles: ModuleTile[] = TILE_ORDER.filter((id) => sources.modules.includes(id)).map((id) => ({
		id,
		label: MODULE_LABELS[id as PlanModule],
		status:
			id === "finance"
				? `${formatMoney(finance.spentToday).replace(/\.00$/, "")} spent today`
				: (statuses[id] ?? ""),
		share: tileShare(id, sources.extra, finance, fashion.look?.worn ?? false),
		tone: MODULE_TONES[id as PlanModule],
		onPress: () => open(id as PlanModule),
	}));

	const minuteNow = minutesOf(now);
	const rest = agenda.filter((item) => item.minutes + Math.max(item.length, 15) > minuteNow);
	const evening = now.getHours() >= 18;

	const detail = (() => {
		if (!rightNow) return "";
		const item = rightNow.item;
		const until = clockOf(item.minutes + item.length);
		if (item.module === "career" && /deep work|applications/i.test(item.title)) {
			const career = sources.career;
			return `Deep work until ${until}${career ? ` · ${career.appliedToday} of ${career.dailyTarget} sent` : ""}`;
		}
		return item.length > 0 ? `${item.detail} · until ${until}` : item.detail;
	})();

	return (
		<>
			<ActionPills
				actions={[
					{ label: "Plan day", icon: "Filled/Calendar", onPress: dailyRoutes.plan },
					{ label: "Log", icon: "Line/Plus", onPress: () => router.push("/listen") },
					evening
						? { label: "Close day", icon: "Moon", onPress: dailyRoutes.close }
						: { label: "Sleep", icon: "Moon", onPress: dailyRoutes.sleep },
				]}
			/>
			{routine && !data.loading && !settings.setUp ? (
				<MinimumPicker settings={settings} sources={sources} />
			) : null}
			{rightNow ? (
				<RightNowCard
					now={rightNow}
					detail={detail}
					onStart={() => open(rightNow.item.module)}
					onLater={() => void pushLater(today, rightNow.item.id).catch(failed)}
				/>
			) : null}
			{routine && settings.setUp ? (
				<MinimumCard
					rings={rings}
					streak={streak}
					onPress={dailyRoutes.minimum}
					onRing={(ring) => {
						if (ring.module === "daily-life") void toggleTick(today, ring.id).catch(failed);
						else open(ring.module);
					}}
				/>
			) : null}
			{tiles.length > 0 ? <ModuleTiles tiles={tiles} /> : null}
			{rest.length > 0 ? (
				<Card>
					<CardHead
						title="Rest of today"
						right={`Now ${clockOf(minuteNow)}`}
						rightTone="accentDefault"
					/>
					<View>
						{rest.map((item) => (
							<AgendaRow key={item.id} item={item} onPress={() => open(item.module)} />
						))}
					</View>
				</Card>
			) : null}
		</>
	);
}
