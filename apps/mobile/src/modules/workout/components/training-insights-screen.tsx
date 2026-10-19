import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { FilterChip } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { addDays, dayKey } from "@/lib/day";
import { haptics } from "@/lib/haptics";
import { useHomeView } from "@/modules/home/store/home-view";
import { usePoTheme } from "@/theme";
import { rebalanceWeek } from "../data/training-actions";
import { useTrainingToday } from "../hooks/use-training";
import {
	personalBests,
	runKm,
	sessionsOnDays,
	type TrainingNote,
	trainingNotes,
	weekDays,
} from "../lib/training-math";
import { trainingRoutes } from "../navigation";
import { Card } from "./home-cards";
import { TrainingScreen } from "./training-screen";

type Range = "week" | "last" | "month";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function rangeDays(range: Range, now: Date): string[] {
	if (range === "month")
		return Array.from({ length: 30 }, (_, step) => dayKey(addDays(now, step - 29)));
	return weekDays(range === "last" ? addDays(now, -7) : now);
}

function previous(range: Range, now: Date): string[] {
	if (range === "month")
		return Array.from({ length: 30 }, (_, step) => dayKey(addDays(now, step - 59)));
	return weekDays(addDays(now, range === "last" ? -14 : -7));
}

const short = (day: string) => {
	const date = new Date(`${day}T12:00:00`);
	return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
};

/** Training Insights: the week in a sentence, three numbers and what's worth acting on. */
export function TrainingInsightsScreen() {
	const { colors } = usePoTheme();
	const { data, now, today, plan, count } = useTrainingToday();
	const updateView = useHomeView((state) => state.update);
	const [range, setRange] = useState<Range>("week");
	const [hidden, setHidden] = useState<string[]>([]);
	const { sessions } = data;
	const days = rangeDays(range, now);
	const inRange = sessionsOnDays(sessions, days);
	const km = runKm(sessions, days);
	const kmBefore = runKm(sessions, previous(range, now));
	const minutes = inRange.reduce((sum, session) => sum + session.durationMin, 0);
	const pulls = personalBests(sessions, now).find((best) => best.label === "Pull-ups");
	const notes = trainingNotes({ sessions, plan, today, now }).filter(
		(note) => !hidden.includes(note.kind),
	);
	const goal = range === "month" ? Math.round((count.goal * 30) / 7) : count.goal;
	const onTrack =
		range === "week"
			? inRange.length >= Math.round((count.goal * (now.getDay() || 7)) / 7)
			: inRange.length >= goal;

	const act = (note: TrainingNote) => {
		if (note.kind === "pull-ups") trainingRoutes.skills();
		else if (note.kind === "long-run") {
			updateView((doc) => ({ ...doc, view: "food" }));
			trainingRoutes.today();
		} else if (note.kind === "missed" && plan) {
			void rebalanceWeek(plan, sessions, today)
				.then(() => haptics.success())
				.catch((error: unknown) => console.error("[training] could not save", error));
		} else trainingRoutes.week();
		setHidden((list) => [...list, note.kind]);
	};

	return (
		<TrainingScreen
			insightsActive
			action={{ icon: "Filled/Calendar", label: "This week", onPress: trainingRoutes.week }}
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
						{`${range === "month" ? "Monthly" : "Weekly"} recap · ${short(days[0] ?? today)} to ${short(days.at(-1) ?? today)}`}
					</PoText>
				</View>
				<PoText variant="title18" tone="textSecondary">
					{inRange.length === 0 ? (
						"No sessions here yet. Today's is on Training's Home."
					) : (
						<>
							<PoText variant="title18">{`${inRange.length} of ${goal} sessions`}</PoText>
							{range === "week" ? " so far" : ""}
							{km > 0 ? ", " : "."}
							{km > 0 ? <PoText variant="title18">{`${km} km`}</PoText> : null}
							{km > 0 ? " run." : ""}
							{pulls?.change ? " Pull-ups are " : ""}
							{pulls?.change ? (
								<PoText variant="title18">{`up ${pulls.change.replace(/\D/g, "")}`}</PoText>
							) : null}
							{pulls?.change ? " in two weeks." : ""}
						</>
					)}
				</PoText>
			</View>
			<View style={styles.stats}>
				<Stat
					label="Sessions"
					value={`${inRange.length}/${goal}`}
					foot={onTrack ? "on track" : "behind"}
					tone={onTrack ? "textSuccess" : "textWarning"}
				/>
				<Stat
					label="Run"
					value={`${km} km`}
					foot={
						kmBefore || km
							? `${km >= kmBefore ? "▲" : "▼"} ${Math.abs(Math.round((km - kmBefore) * 10) / 10)}`
							: "–"
					}
					tone={km >= kmBefore ? "textSuccess" : "textDanger"}
				/>
				<Stat
					label="Active"
					value={`${minutes} min`}
					foot={`${Math.round(minutes / Math.max(1, days.length))} a day`}
					tone="textTertiary"
				/>
			</View>
			{notes.length > 0 ? (
				<PoText variant="eyebrow11" tone="textTertiary" style={styles.pad}>
					What I noticed
				</PoText>
			) : null}
			{notes.map((note) => {
				const text = noteText(note);
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
		</TrainingScreen>
	);
}

function noteText(note: TrainingNote) {
	switch (note.kind) {
		case "pull-ups":
			return {
				title: "Pull-ups are moving",
				body: `${note.best} strict pull-ups, up ${note.change} in two weeks. You're ready for explosive pulls toward the muscle-up.`,
				primary: "Open skills",
				secondary: "Got it",
			};
		case "long-run":
			return {
				title: "Eat for the run",
				body: `${DAY_NAMES[new Date(`${note.day}T12:00:00`).getDay()]}'s ${note.km} km long run needs fuel. A banana shake the night before and oats in the morning will carry you.`,
				primary: "Open Food",
				secondary: "Later",
			};
		case "missed":
			return {
				title: "Missed one",
				body: note.movedTo
					? `${note.title} moved to ${DAY_NAMES[new Date(`${note.movedTo}T12:00:00`).getDay()]}. Never miss twice.`
					: `${note.title} didn't happen. Move it to the next easy day so the week still adds up.`,
				primary: note.movedTo ? "See the week" : "Move it",
				secondary: "Leave it",
			};
		case "boxing":
			return {
				title: "Boxing consistency",
				body: `Shadow boxing held for ${note.weeks} weeks straight. When the job lands, a club 3 times a week is the next step.`,
				primary: "See the week",
				secondary: "Later",
			};
	}
}

function Stat({
	label,
	value,
	foot,
	tone,
}: {
	label: string;
	value: string;
	foot: string;
	tone: "textSuccess" | "textWarning" | "textDanger" | "textTertiary";
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
			<PoText variant="title18">{value}</PoText>
			<PoText variant="mono13" tone={tone}>
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
