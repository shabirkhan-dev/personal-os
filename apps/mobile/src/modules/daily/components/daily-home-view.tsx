import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { ActionPills } from "@/components/module-ui";
import { PoText } from "@/components/ui/po-text";
import { formatMoney } from "@/lib/money";
import { voiceOut } from "@/lib/voice";
import { useCareStatus } from "@/modules/care";
import { useCareerStatus } from "@/modules/career";
import { useFashionDay, useFashionStatus } from "@/modules/fashion";
import { useFaithStatus } from "@/modules/faith";
import { useFinanceSummary } from "@/modules/finance";
import { useFoodStatus } from "@/modules/food";
import { AskBar } from "@/modules/home/components/ask-bar";
import { clockOf, minutesOf } from "@/modules/home/lib/module-day";
import type { HomeModuleViewProps } from "@/modules/home/lib/module-home";
import { routeLine } from "@/modules/home/lib/route-line";
import { useAskInbox } from "@/modules/home/store/ask-inbox";
import { useHomeView } from "@/modules/home/store/home-view";
import type { ModuleId } from "@/modules/onboarding/lib/options";
import { useWorkoutStatus } from "@/modules/workout";
import { pushLater, recordResult, saveSleep, toggleTick } from "../data/daily-actions";
import { useDailyToday } from "../hooks/use-daily";
import { MINIMUM, MODULE_LABELS, minimumState } from "../lib/daily-math";
import type { PlanModule } from "../lib/daily-model";
import { parseDailyLine } from "../lib/parse-daily-line";
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

/** Modules whose Home takes a line handed over from another screen. */
const LISTENERS: ReadonlySet<ModuleId> = new Set<ModuleId>([
	"faith",
	"career",
	"fashion",
	"food",
	"skincare",
]);

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

/** Daily life Home, the hub: what's now, the minimum day, every module today and the rest of it. */
export function DailyHomeView({ actionRequest }: HomeModuleViewProps) {
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
	const updateView = useHomeView((state) => state.update);
	const send = useAskInbox((state) => state.send);
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
	const [notice, setNotice] = useState<string | null>(null);

	const lastRequest = useRef(actionRequest);
	useEffect(() => {
		if (actionRequest === lastRequest.current) return;
		lastRequest.current = actionRequest;
		dailyRoutes.brief();
	}, [actionRequest]);

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
		if (module === "daily-life") return;
		updateView((doc) => ({ ...doc, view: module }));
	};

	const say = (text: string, spoken: boolean) => {
		setNotice(text);
		if (spoken) voiceOut.speak(text);
	};

	const onLine = (text: string, spoken: boolean) => {
		const intent = parseDailyLine(text, settings.wakeAt);
		if (!intent) return;
		if (intent.kind === "sleep") {
			const wake = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, intent.wake);
			const bed = new Date(wake);
			bed.setHours(0, intent.bed);
			if (intent.bed > intent.wake) bed.setDate(bed.getDate() - 1);
			saveSleep(bed, wake)
				.then(() => say(`Logged sleep ${clockOf(intent.bed)} to ${clockOf(intent.wake)}.`, spoken))
				.catch(() => setNotice("Couldn't save on this phone. Try again."));
			return;
		}
		if (intent.kind === "tick") {
			void toggleTick(log, today, intent.id).then(() =>
				say(`${MINIMUM[intent.id].label} ticked for today.`, spoken),
			);
			return;
		}
		if (intent.kind === "next") {
			say(
				rightNow
					? `${rightNow.state === "now" ? "Now" : "Next"}: ${rightNow.item.title} at ${clockOf(rightNow.item.minutes)}.`
					: "Nothing else planned today. Rest counts too.",
				spoken,
			);
			return;
		}
		if (intent.kind === "open") {
			dailyRoutes[intent.screen]();
			return;
		}
		const target = routeLine(text, sources.modules);
		if (target && LISTENERS.has(target)) {
			send({ module: target, text, spoken });
			updateView((doc) => ({ ...doc, view: target }));
			return;
		}
		if (target) {
			open(target as PlanModule);
			return;
		}
		say(
			"I'll log that once you say which part of your day it's for, like a meal, a prayer or a job.",
			spoken,
		);
	};

	// A line said on Talk to OS lands here.
	const inboxLine = useAskInbox((state) => state.line);
	useEffect(() => {
		if (data.loading || inboxLine?.module !== "daily-life") return;
		const line = useAskInbox.getState().take("daily-life");
		if (line) onLine(line.text, line.spoken);
		// oxlint-disable-next-line react/exhaustive-deps -- runs when a line arrives
	}, [inboxLine, data.loading]);

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
			<View style={styles.ask}>
				<AskBar suggestions={[]} placeholder="Log anything or ask what's next…" onSubmit={onLine} />
				<ActionPills
					actions={[
						{ label: "Plan day", icon: "Filled/Calendar", onPress: dailyRoutes.plan },
						{ label: "Log", icon: "Line/Plus", onPress: () => router.push("/listen") },
						evening
							? { label: "Close day", icon: "Moon", onPress: dailyRoutes.close }
							: { label: "Sleep", icon: "Moon", onPress: dailyRoutes.sleep },
					]}
				/>
			</View>
			{notice ? (
				<PoText variant="meta13" tone="textSecondary" style={styles.notice}>
					{notice}
				</PoText>
			) : null}
			{!data.loading && !settings.setUp ? (
				<MinimumPicker settings={settings} sources={sources} />
			) : null}
			{settings.setUp && rightNow ? (
				<RightNowCard
					now={rightNow}
					detail={detail}
					onStart={() => open(rightNow.item.module)}
					onLater={() => void pushLater(log, today, rightNow.item.id)}
				/>
			) : null}
			{settings.setUp ? (
				<MinimumCard
					rings={rings}
					streak={streak}
					onPress={dailyRoutes.minimum}
					onRing={(ring) => {
						if (ring.module === "daily-life") void toggleTick(log, today, ring.id);
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
							<AgendaRow
								key={item.id}
								item={item}
								onPress={() =>
									item.module === "daily-life" ? dailyRoutes.sleep() : open(item.module)
								}
							/>
						))}
					</View>
				</Card>
			) : null}
		</>
	);
}

const styles = StyleSheet.create({
	ask: { gap: 12 },
	notice: { paddingHorizontal: 6 },
});
