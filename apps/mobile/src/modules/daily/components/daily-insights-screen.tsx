import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { FilterChip } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { addDays } from "@/lib/day";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import { saveSettings } from "../data/daily-actions";
import { useDailyToday } from "../hooks/use-daily";
import {
	averageSleep,
	type DailyNote,
	dailyNotes,
	hoursLabel,
	lastDays,
	recap,
	weekDays,
} from "../lib/daily-math";
import { dailyRoutes } from "../navigation";
import { Card } from "./daily-cards";
import { DailyScreen } from "./daily-screen";

type Range = "week" | "last" | "month";
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function rangeDays(range: Range, now: Date): string[] {
	if (range === "month") return lastDays(now, 30);
	return weekDays(range === "last" ? addDays(now, -7) : now);
}

const short = (day: string) => {
	const date = new Date(`${day}T12:00:00`);
	return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
};

/** Daily Insights: how the minimum day went, sleep, the streak, and what would protect it. */
export function DailyInsightsScreen() {
	const { colors } = usePoTheme();
	const { data, sources, now, today, streak } = useDailyToday();
	const [range, setRange] = useState<Range>("week");
	const [hidden, setHidden] = useState<string[]>([]);
	const [notice, setNotice] = useState<string | null>(null);
	const days = rangeDays(range, now);
	const summary = recap(data.logs, data.sleep, days, today);
	const sleep = averageSleep(data.sleep, days);
	const notes = dailyNotes({
		logs: data.logs,
		sleep: data.sleep,
		startHours: sources.extra.workout.startHours,
		range: days,
		today,
		size: data.settings.minimum.length,
	}).filter((note) => !hidden.includes(note.kind));
	const label = `${range === "month" ? "Monthly" : "Weekly"} recap · ${short(days[0] ?? today)} to ${short(days.at(-1) ?? today)}`;

	const act = (note: DailyNote) => {
		if (note.kind === "late-nights") {
			void saveSettings({
				...data.settings,
				alarms: { ...data.settings.alarms, windDown: true },
			})
				.then(() => {
					haptics.success();
					setNotice("Wind-down reminder is on.");
				})
				.catch((error: unknown) => {
					console.error("[daily] could not save", error);
					setNotice("Couldn't save on this phone. Try again.");
				});
		} else if (note.kind === "train-time") {
			setNotice("Move training in the Training module; Daily's plan follows it.");
		} else {
			dailyRoutes.minimum();
		}
		setHidden((list) => [...list, note.kind]);
	};

	return (
		<DailyScreen
			insightsActive
			action={{ icon: "Filled/Calendar", label: "Plan the day", onPress: dailyRoutes.plan }}
		>
			<View style={styles.ranges}>
				<FilterChip
					label="This week"
					selected={range === "week"}
					onPress={() => setRange("week")}
				/>
				<FilterChip
					label="Last week"
					selected={range === "last"}
					onPress={() => setRange("last")}
				/>
				<FilterChip label="Month" selected={range === "month"} onPress={() => setRange("month")} />
			</View>
			<View style={styles.recap}>
				<View style={styles.eyebrow}>
					<Icon name="Filled/Sparkle" size={14} color={colors.accentDefault} />
					<PoText variant="eyebrow11" tone="textTertiary">
						{label}
					</PoText>
				</View>
				{summary.days === 0 ? (
					<PoText variant="title18" tone="textSecondary">
						Nothing to look back on yet. Keep today's minimum day and this fills in.
					</PoText>
				) : (
					<PoText variant="title18" tone="textSecondary">
						{"You kept your minimum day "}
						<PoText variant="title18">{`${summary.kept} of ${summary.days} days`}</PoText>
						{"."}
						{summary.missDay
							? ` The miss was ${DAY_NAMES[new Date(`${summary.missDay}T12:00:00`).getDay()]}`
							: ""}
						{summary.missDay && summary.missAfterLate ? ", after a " : summary.missDay ? "." : ""}
						{summary.missDay && summary.missAfterLate ? (
							<PoText variant="title18">late night</PoText>
						) : null}
						{summary.missDay && summary.missAfterLate ? "." : ""}
						{" Your streak is "}
						<PoText
							variant="title18"
							tone="textSuccess"
						>{`${streak} day${streak === 1 ? "" : "s"}`}</PoText>
						{"."}
					</PoText>
				)}
			</View>
			<View style={styles.stats}>
				<Stat
					label="Minimum day"
					value={summary.days ? `${summary.kept}/${summary.days}` : "–"}
					foot={summary.days ? `${Math.round((summary.kept / summary.days) * 100)}%` : "this week"}
				/>
				<Stat
					label="Sleep"
					value={sleep !== null ? hoursLabel(sleep) : "–"}
					foot={sleep !== null ? `target ${hoursLabel(data.settings.sleepTarget)}` : "log nights"}
				/>
				<Stat
					label="Streak"
					value={`${streak} day${streak === 1 ? "" : "s"}`}
					foot="never miss twice"
				/>
			</View>
			{notice ? (
				<PoText variant="meta13" tone="textSecondary" style={styles.pad}>
					{notice}
				</PoText>
			) : null}
			{notes.length > 0 ? (
				<PoText variant="eyebrow11" tone="textTertiary" style={styles.pad}>
					What I noticed
				</PoText>
			) : null}
			{notes.map((note) => {
				const text = noteText(note, data.settings.windDownAt);
				return (
					<Card key={note.kind}>
						<View style={styles.eyebrow}>
							<Icon name="Filled/Sparkle" size={14} color={colors.accentDefault} />
							<PoText variant="eyebrow11" tone="textTertiary">
								{text.title}
							</PoText>
						</View>
						<PoText variant="body15" tone="textSecondary">
							{text.body}
						</PoText>
						<View style={styles.actions}>
							<PillButton label={text.primary} style={styles.flex} onPress={() => act(note)} />
							<PillButton
								label={text.secondary}
								variant="secondary"
								onPress={() => setHidden((list) => [...list, note.kind])}
							/>
						</View>
					</Card>
				);
			})}
		</DailyScreen>
	);
}

function noteText(note: DailyNote, windDownAt: number) {
	const hh = `${String(Math.floor(windDownAt / 60)).padStart(2, "0")}:${String(windDownAt % 60).padStart(2, "0")}`;
	switch (note.kind) {
		case "late-nights":
			return {
				title: "Sleep and your streak",
				body: `${note.late} of your ${note.misses} missed day${note.misses === 1 ? "" : "s"} came after sleeping past midnight. Getting to bed on time protects the streak more than anything else.`,
				primary: `Bedtime reminder ${hh}`,
				secondary: "Not now",
			};
		case "train-time": {
			const mornings = note.morning > note.evening;
			return {
				title: "Best time to train",
				body: `${mornings ? note.morning : note.evening} of your last ${note.total} sessions were in the ${mornings ? "morning" : "evening"}. That's when training actually happens for you.`,
				primary: mornings ? "Move training to mornings" : "Keep evenings",
				secondary: "Keep",
			};
		}
		case "too-big":
			return {
				title: "Smaller on busy days",
				body: `You kept ${note.kept} of ${note.days} days with ${note.size} things. Three that always happen beat five that sometimes do.`,
				primary: "Make it smaller",
				secondary: "No",
			};
	}
}

function Stat({ label, value, foot }: { label: string; value: string; foot: string }) {
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
			<PoText variant="title18">{value}</PoText>
			<PoText variant="mono13" tone="textTertiary">
				{foot}
			</PoText>
		</View>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	ranges: { flexDirection: "row", gap: 8 },
	recap: { gap: 8, paddingHorizontal: 4 },
	eyebrow: { flexDirection: "row", alignItems: "center", gap: 8 },
	stats: { flexDirection: "row", gap: 8 },
	stat: { flex: 1, gap: 4, padding: 14, borderRadius: 24, borderWidth: 1 },
	pad: { paddingHorizontal: 6 },
	actions: { flexDirection: "row", gap: 8 },
});
