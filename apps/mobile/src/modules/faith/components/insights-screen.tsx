import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { FilterChip, MetaChip, SectionLabel } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { addDays } from "@/lib/day";
import { useNow } from "@/lib/use-now";
import { useSpeaker } from "@/lib/voice";
import { usePoTheme } from "@/theme";
import { saveSettings } from "../data/faith-actions";
import { useFaithUi } from "../hooks/faith-ui-store";
import { useFaith } from "../hooks/use-faith";
import {
	type Insight,
	insights,
	timesSource,
	weekRecap,
	type WeekRecap,
	shortDate,
	weekStart,
	weekdayName,
} from "../lib/faith-math";
import { dayTimes, PRAYER_LABELS } from "../lib/prayer-times";
import { faithRoutes } from "../navigation";
import { scheduleOnce } from "../services/prayer-reminders";
import { FaithScreen } from "./faith-screen";

type Range = "week" | "last" | "month";

const RANGES: readonly { id: Range; label: string }[] = [
	{ id: "week", label: "This week" },
	{ id: "last", label: "Last week" },
	{ id: "month", label: "Month" },
];

function rangeDates(range: Range, now: Date): { from: Date; days: number } {
	const monday = weekStart(now);
	if (range === "week") return { from: monday, days: 7 };
	if (range === "last") return { from: addDays(monday, -7), days: 7 };
	return { from: addDays(now, -29), days: 30 };
}

/** One or two plain sentences about the period, in the Figma recap's voice. */
function recapLine(recap: WeekRecap, days: number): { lead: string; good: string; rest: string } {
	if (recap.prayed === 0) {
		return {
			lead: "Nothing logged yet.",
			good: "",
			rest: " Log a prayer from Home and your recap starts here.",
		};
	}
	const perfect = recap.perfect[0];
	const slipped = recap.slipped;
	return {
		lead: `${recap.prayed} of ${recap.possible} prayers${perfect ? ", and " : "."}`,
		good: perfect
			? `${PRAYER_LABELS[perfect]} every single day${days > 7 ? " for 30 days" : ""}.`
			: "",
		rest: slipped
			? ` ${PRAYER_LABELS[slipped.prayer]} slipped ${slipped.count === 1 ? "once" : `${slipped.count} times`}, last on ${weekdayName(new Date(`${slipped.lastDay}T12:00:00`))}.`
			: " Nothing slipped.",
	};
}

function delta(value: number, before: number, unit = ""): string {
	return value === before
		? "same"
		: `${value > before ? "▲" : "▼"} ${Math.abs(value - before)}${unit}`;
}

/** Faith Insights: the period's recap, three numbers and what the app noticed, with one tap to act. */
export function InsightsScreen() {
	const { colors } = usePoTheme();
	const { logs, sessions, settings } = useFaith();
	const now = useNow();
	const speaker = useSpeaker();
	const openSheet = useFaithUi((state) => state.openSheet);
	const [range, setRange] = useState<Range>("week");
	const [hidden, setHidden] = useState<string[]>([]);
	const [notice, setNotice] = useState<string | null>(null);

	const { recap, previous, line, found, label } = useMemo(() => {
		const { from, days } = rangeDates(range, now);
		const current = weekRecap(logs, sessions, settings.prayers, from, days);
		const before = weekRecap(logs, sessions, settings.prayers, addDays(from, -days), days);
		return {
			recap: current,
			previous: before,
			line: recapLine(current, days),
			found: insights(logs, sessions, settings, now),
			label: `${shortDate(from)}–${shortDate(addDays(from, days - 1))}`,
		};
	}, [range, now, logs, sessions, settings]);

	const act = async (insight: Insight) => {
		const tomorrow = addDays(now, 1);
		const fajr = dayTimes(timesSource(settings), tomorrow).prayers.fajr;
		let message = "";
		if (insight.action.kind === "earlier-reminder") {
			const lead = Math.min(30, settings.reminderLead + 15);
			await saveSettings({ ...settings, reminderLead: lead });
			message = `Reminders now come ${lead} minutes before.`;
		} else if (insight.action.kind === "fajr-alarm" && fajr) {
			const ok = await scheduleOnce(
				new Date(fajr.getTime() - 15 * 60_000),
				"Fajr is soon",
				"Time to wake up for Fajr.",
			);
			message = ok
				? "Fajr alarm set for tomorrow."
				: "Turn on notifications for Personal OS first.";
		} else if (insight.action.kind === "recite-after-fajr" && fajr) {
			const ok = await scheduleOnce(
				new Date(fajr.getTime() + 20 * 60_000),
				"Your recitation",
				`${settings.recitationMinutes} minutes, right after Fajr.`,
			);
			message = ok
				? "I'll remind you after Fajr tomorrow."
				: "Turn on notifications for Personal OS first.";
		} else {
			openSheet("reminders");
			faithRoutes.today();
			return;
		}
		setHidden((current) => [...current, insight.id]);
		setNotice(message);
	};

	const onTime = Math.round(recap.onTimeShare * 100);
	const spoken = `${line.lead} ${line.good}${line.rest}`;

	return (
		<FaithScreen insightsActive>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.ranges}
			>
				{RANGES.map((item) => (
					<FilterChip
						key={item.id}
						label={item.label}
						selected={range === item.id}
						onPress={() => setRange(item.id)}
					/>
				))}
			</ScrollView>

			<View style={styles.recap}>
				<View style={styles.eyebrow}>
					<Icon name="Filled/Sparkle" size={14} color={colors.statusViolet} />
					<PoText variant="eyebrow11" tone="textTertiary" style={styles.flex}>
						{`${range === "month" ? "Monthly" : "Weekly"} recap · ${label}`}
					</PoText>
					{speaker.available ? (
						<MetaChip
							icon={speaker.speaking === "recap" ? "Pause" : "Filled/Play"}
							label={speaker.speaking === "recap" ? "Stop" : "Listen"}
							onPress={() =>
								speaker.speaking === "recap"
									? speaker.stop()
									: speaker.speak("recap", [{ text: spoken }])
							}
						/>
					) : null}
				</View>
				<PoText variant="title18">
					{line.lead}
					{line.good ? (
						<PoText variant="title18" tone="textSuccess">{` ${line.good}`}</PoText>
					) : null}
					<PoText variant="title18" tone="textSecondary">
						{line.rest}
					</PoText>
				</PoText>
			</View>

			<View style={styles.stats}>
				<Stat
					label="Prayers"
					value={`${recap.prayed}/${recap.possible}`}
					change={delta(recap.prayed, previous.prayed)}
					up={recap.prayed >= previous.prayed}
				/>
				<Stat
					label="On time"
					value={`${onTime}%`}
					change={delta(onTime, Math.round(previous.onTimeShare * 100), "%")}
					up={onTime >= Math.round(previous.onTimeShare * 100)}
				/>
				<Stat
					label="Recitation"
					value={`${Math.round(recap.recitationMinutes)} min`}
					change={delta(
						Math.round(recap.recitationMinutes),
						Math.round(previous.recitationMinutes),
						"m",
					)}
					up={recap.recitationMinutes >= previous.recitationMinutes}
				/>
			</View>

			{notice ? (
				<PoText variant="meta13" tone="textSecondary" style={styles.notice}>
					{notice}
				</PoText>
			) : null}

			<SectionLabel>What I noticed</SectionLabel>
			{found
				.filter((insight) => !hidden.includes(insight.id))
				.map((insight) => (
					<View
						key={insight.id}
						style={[
							styles.card,
							{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
						]}
					>
						<View style={styles.eyebrow}>
							<Icon name="Filled/Sparkle" size={14} color={colors.statusViolet} />
							<PoText variant="eyebrow11" tone="textTertiary">
								{insight.label}
							</PoText>
						</View>
						<PoText variant="body15" tone="textSecondary">
							{insight.body}
						</PoText>
						<View style={styles.actions}>
							<PillButton
								label={insight.action.label}
								onPress={() =>
									void act(insight).catch((error: unknown) => {
										console.error("[faith] insight action failed", error);
										setNotice("That didn't work. Try again.");
									})
								}
								style={styles.flex}
							/>
							<PillButton
								label="Not now"
								variant="secondary"
								onPress={() => setHidden((current) => [...current, insight.id])}
							/>
						</View>
					</View>
				))}
		</FaithScreen>
	);
}

function Stat({
	label,
	value,
	change,
	up,
}: {
	label: string;
	value: string;
	change: string;
	up: boolean;
}) {
	const { colors } = usePoTheme();
	return (
		<View
			style={[
				styles.stat,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			<PoText variant="meta13" tone="textSecondary">
				{label}
			</PoText>
			<PoText variant="title18" numberOfLines={1} adjustsFontSizeToFit>
				{value}
			</PoText>
			<PoText
				variant="mono13"
				tone={change === "same" ? "textTertiary" : up ? "textSuccess" : "textDanger"}
			>
				{change}
			</PoText>
		</View>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	ranges: { gap: 8 },
	recap: { gap: 10, paddingHorizontal: 4 },
	eyebrow: { flexDirection: "row", alignItems: "center", gap: 8 },
	stats: { flexDirection: "row", gap: 8 },
	stat: { flex: 1, gap: 4, padding: 14, borderRadius: 20, borderWidth: 1 },
	notice: { paddingHorizontal: 6 },
	card: { gap: 12, padding: 18, borderRadius: 28, borderWidth: 1 },
	actions: { flexDirection: "row", gap: 8 },
});
