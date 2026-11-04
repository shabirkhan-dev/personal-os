import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ActionPills } from "@/components/module-ui";
import { PoText } from "@/components/ui/po-text";
import { useCalendar } from "@/modules/calendar/hooks/use-calendar";
import { clockOf, minutesOf } from "@/modules/home/lib/module-day";
import type { ModuleId } from "@/modules/onboarding/lib/options";
import { pushLater, recordResult, toggleTick } from "../data/daily-actions";
import { useDailyToday } from "../hooks/use-daily";
import { MINIMUM, minimumState } from "../lib/daily-math";
import type { PlanModule } from "../lib/daily-model";
import { splitAtNow, type TimelineItem, todayTimeline } from "../lib/timeline";
import { dailyRoutes } from "../navigation";
import { scheduleDailyAlarms } from "../services/daily-alarms";
import {
	AgendaRow,
	Card,
	CardHead,
	MinimumCard,
	type MinimumRing,
	NowLine,
	RightNowCard,
} from "./daily-cards";
import { MinimumPicker } from "./minimum-picker";

export type DailyOverviewProps = {
	/** Opens a module's Home on Today. */
	onOpen: (module: ModuleId) => void;
	/** Shows a short message under the ask bar. */
	onNotice: (text: string) => void;
};

/** Earlier rows shown above Now before "Show earlier"; the rest fold away. */
const EARLIER_SHOWN = 2;

/**
 * The day on Overview: plan, close and sleep, what's on right now, the minimum day (when the
 * routine is on) and one Today timeline across every module, bills and personal events. It also
 * keeps today's result for the streak and the day's alarms scheduled.
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
	const calendar = useCalendar(today, today);
	const [showEarlier, setShowEarlier] = useState(false);
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

	const minuteNow = minutesOf(now);
	const timeline = todayTimeline(agenda, calendar.items, today);
	const { earlier, ahead } = splitAtNow(timeline, minuteNow);
	const folded = showEarlier ? 0 : Math.max(0, earlier.length - EARLIER_SHOWN);
	const openRow = (item: TimelineItem) =>
		item.link ? router.push("/calendar") : open(item.module);
	const row = (item: TimelineItem, past: boolean) => (
		<AgendaRow
			key={item.id}
			item={item}
			past={past}
			time={item.allDay ? "All day" : undefined}
			onPress={() => openRow(item)}
		/>
	);
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
			{timeline.length > 0 ? (
				<Card>
					<CardHead
						title="Today"
						right={`${timeline.filter((item) => item.done).length} of ${timeline.length} done`}
					/>
					<View>
						{folded > 0 ? (
							<Pressable
								accessibilityRole="button"
								onPress={() => setShowEarlier(true)}
								style={styles.earlier}
							>
								<PoText variant="meta13" tone="textLink">
									{`Show ${folded} earlier`}
								</PoText>
							</Pressable>
						) : null}
						{earlier.slice(folded).map((item) => row(item, true))}
						<NowLine minutes={minuteNow} />
						{ahead.map((item) => row(item, false))}
						{ahead.length === 0 ? (
							<PoText variant="meta13" tone="textTertiary" style={styles.earlier}>
								Nothing else planned today.
							</PoText>
						) : null}
					</View>
				</Card>
			) : null}
		</>
	);
}

const styles = StyleSheet.create({
	earlier: { paddingVertical: 8, paddingLeft: 64 },
});
