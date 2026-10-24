import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { FilterChip } from "@/components/module-ui";
import { Icon } from "@/components/icons";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { dayKey } from "@/lib/day";
import { usePoTheme } from "@/theme";
import type { Activity } from "../lib/activities";
import type { ProgramDef } from "../lib/programs/program-model";
import {
	activityTotals,
	adherence,
	adherenceShare,
	exerciseHistory,
	loggedExercises,
	type Readiness,
	records,
	testResults,
	volumeByPattern,
} from "../lib/stats";
import { sessionLine, slotState } from "../lib/training-math";
import { templateById } from "../lib/library";
import type { Session, TrainingSettings, WeekPlan } from "../lib/training-model";
import { trainingAiMessage, useTrainingAi } from "../services/training-ai";
import { Card, CardHead } from "./home-cards";
import { BarChart, RowBars } from "./progress-chart";

const LEVEL_TEXT = {
	push: {
		title: "Ready to push",
		body: "Go for it today: aim to beat last time.",
		tone: "statusSuccess",
	},
	steady: {
		title: "Train as planned",
		body: "A normal session. Stop a rep short of failure.",
		tone: "statusCaution",
	},
	easy: {
		title: "Take it easy",
		body: "Do the light version: fewer sets, or mobility instead.",
		tone: "statusDanger",
	},
} as const;

const shortDay = (day: string) =>
	new Date(`${day}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

/** How ready today is, and why. */
export function ReadinessCard({ value }: { value: Readiness }) {
	const { colors } = usePoTheme();
	const text = LEVEL_TEXT[value.level];
	return (
		<View
			style={[
				styles.readiness,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			<View style={[styles.score, { borderColor: colors[text.tone] }]}>
				<PoText variant="row15">{String(value.score)}</PoText>
			</View>
			<View style={styles.flex}>
				<PoText variant="row15">{text.title}</PoText>
				<PoText variant="meta13" tone="textSecondary">
					{value.reasons.length > 0 ? `${value.reasons.join(" · ")}. ${text.body}` : text.body}
				</PoText>
			</View>
		</View>
	);
}

/** One exercise over time: pick it, see every day's best set. */
export function ExerciseProgressCard({ sessions }: { sessions: readonly Session[] }) {
	const exercises = loggedExercises(sessions).slice(0, 12);
	const [name, setName] = useState<string | null>(null);
	const chosen = name ?? exercises[0]?.name ?? null;
	if (!chosen) {
		return (
			<Card>
				<CardHead title="Exercise progress" />
				<PoText variant="meta13" tone="textSecondary">
					Log sets in a live session and each exercise's progress shows here.
				</PoText>
			</Card>
		);
	}
	const history = exerciseHistory(sessions, chosen).slice(-12);
	const unit = history[0]?.unit ?? "reps";
	return (
		<Card>
			<CardHead title="Exercise progress" right={`${history.length} sessions`} />
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.chips}
			>
				{exercises.map((item) => (
					<FilterChip
						key={item.name}
						label={item.name}
						selected={chosen === item.name}
						onPress={() => setName(item.name)}
					/>
				))}
			</ScrollView>
			<BarChart
				unit={unit === "kg" ? "kg" : unit === "s" ? "s" : "reps"}
				bars={history.map((point) => ({
					key: point.day,
					value: point.best,
					label: shortDay(point.day),
					detail: `${shortDay(point.day)} · ${point.sets} sets${point.max ? ` · est. max ${point.max} kg` : ""}`,
				}))}
			/>
		</Card>
	);
}

export function RecordsCard({ sessions }: { sessions: readonly Session[] }) {
	const list = records(sessions);
	if (list.length === 0) return null;
	return (
		<Card>
			<CardHead title="Personal bests" />
			{list.map((record) => (
				<View key={record.name} style={styles.line}>
					<PoText variant="row15" style={styles.flex}>
						{record.name}
					</PoText>
					<PoText variant="mono13" tone="textSecondary">
						{record.best}
					</PoText>
				</View>
			))}
		</Card>
	);
}

/** Sets per movement pattern this week, so imbalances (lots of push, no pull) show. */
export function VolumeCard({ sessions, now }: { sessions: readonly Session[]; now: Date }) {
	const [weeks, setWeeks] = useState(1);
	const rows = volumeByPattern(sessions, now, weeks);
	return (
		<Card>
			<CardHead title="Sets by movement" right={weeks === 1 ? "last 7 days" : "last 4 weeks"} />
			<View style={styles.chipsRow}>
				<FilterChip label="7 days" selected={weeks === 1} onPress={() => setWeeks(1)} />
				<FilterChip label="4 weeks" selected={weeks === 4} onPress={() => setWeeks(4)} />
			</View>
			{rows.length === 0 ? (
				<PoText variant="meta13" tone="textSecondary">
					No sets logged in this period.
				</PoText>
			) : (
				<RowBars
					rows={rows
						.slice(0, 8)
						.map((row) => ({ label: row.pattern, value: row.sets, text: `${row.sets} sets` }))}
				/>
			)}
		</Card>
	);
}

/** Planned sessions done, week by week. */
export function ConsistencyCard({
	plans,
	sessions,
	now,
}: {
	plans: readonly WeekPlan[];
	sessions: readonly Session[];
	now: Date;
}) {
	const weeks = adherence(plans, sessions, now, 6);
	const share = adherenceShare(weeks);
	return (
		<Card>
			<CardHead
				title="Consistency"
				right={share === null ? "" : `${Math.round(share * 100)}% of planned`}
			/>
			<RowBars
				rows={weeks.map((week) => ({
					label: `w/c ${shortDay(week.monday)}`,
					value: week.planned > 0 ? week.done / week.planned : 0,
					text: week.planned > 0 ? `${week.done}/${week.planned}` : "–",
				}))}
			/>
		</Card>
	);
}

/** Each activity's month: sessions, time, distance and its own numbers. */
export function ActivityTotalsCard({
	sessions,
	activities,
	days,
}: {
	sessions: readonly Session[];
	activities: readonly Activity[];
	days: readonly string[];
}) {
	const totals = activityTotals(sessions, activities, days);
	if (totals.length === 0) return null;
	return (
		<Card>
			<CardHead title="Activities" right="last 30 days" />
			{totals.map((total) => (
				<View key={total.activity.id} style={styles.block}>
					<View style={styles.line}>
						<PoText variant="row15" style={styles.flex}>
							{total.activity.name}
						</PoText>
						<PoText variant="mono13" tone="textSecondary">
							{`${total.count}× · ${Math.round(total.minutes / 6) / 10} h${total.km ? ` · ${total.km} km` : ""}`}
						</PoText>
					</View>
					{total.metrics.some((metric) => metric.total > 0) ? (
						<PoText variant="meta13" tone="textSecondary">
							{total.metrics
								.filter((metric) => metric.total > 0)
								.map(
									(metric) =>
										`${metric.label} ${metric.total}${metric.unit ? ` ${metric.unit}` : ""}`,
								)
								.join(" · ")}
						</PoText>
					) : null}
				</View>
			))}
		</Card>
	);
}

/** Program test weeks: the all-out sets, newest first, so progress across blocks shows. */
export function TestsCard({
	sessions,
	programs,
}: {
	sessions: readonly Session[];
	programs: readonly ProgramDef[];
}) {
	const results = testResults(sessions, programs).slice(0, 4);
	if (results.length === 0) return null;
	return (
		<Card>
			<CardHead title="Test weeks" />
			{results.map((result) => (
				<View key={`${result.day}-${result.week}`} style={styles.block}>
					<PoText variant="eyebrow11" tone="textTertiary">
						{`${result.program} · week ${result.week} · ${shortDay(result.day)}`}
					</PoText>
					<PoText variant="meta13" tone="textSecondary">
						{result.sets
							.map((set) => `${set.exercise} ${set.value}${set.unit === "s" ? " s" : ""}`)
							.join(" · ")}
					</PoText>
				</View>
			))}
		</Card>
	);
}

/** An AI review of the week from the real data: what went well, what to change, one focus. */
export function WeeklyReviewCard({
	settings,
	plan,
	sessions,
	today,
}: {
	settings: TrainingSettings;
	plan: WeekPlan | null;
	sessions: readonly Session[];
	today: string;
}) {
	const { colors } = usePoTheme();
	const ai = useTrainingAi();
	const [answer, setAnswer] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const review = async () => {
		setBusy(true);
		setError(null);
		try {
			const result = await ai.ask({
				question:
					"Review my training this week: what went well, what to change next week, and one thing to focus on.",
				sports: settings.sports,
				phase: settings.phase,
				week: (plan?.slots ?? []).map((slot) => ({
					day: slot.day,
					title: templateById(slot.template)?.title ?? "Rest",
					status: slotState(slot, sessions, today),
				})),
				recent: sessions.slice(0, 10).map((session) => ({
					day: dayKey(new Date(session.startedAt)),
					title: session.title,
					line: sessionLine(session),
				})),
			});
			setAnswer(result.answer);
		} catch (caught) {
			setError(trainingAiMessage(caught));
		} finally {
			setBusy(false);
		}
	};

	return (
		<Card>
			<View style={styles.aiHead}>
				<Icon name="Filled/Sparkle" size={14} color={colors.accentDefault} />
				<PoText variant="title18">Weekly review</PoText>
			</View>
			{answer ? (
				<PoText variant="body15">{answer}</PoText>
			) : (
				<PoText variant="meta13" tone="textSecondary">
					AI reads your week and recent sessions and tells you what to change next week.
				</PoText>
			)}
			{error ? (
				<PoText variant="meta13" tone="textDanger">
					{error}
				</PoText>
			) : null}
			<PillButton
				label={busy ? "Reviewing…" : answer ? "Review again" : "Review my week"}
				variant="secondary"
				disabled={busy || !ai.available}
				accessory={busy ? <ActivityIndicator size="small" color={colors.textPrimary} /> : undefined}
				onPress={() => void review()}
			/>
			{!ai.available ? (
				<PoText variant="meta13" tone="textSecondary">
					Sign in from Profile to use AI.
				</PoText>
			) : null}
		</Card>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	readiness: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
		padding: 16,
		borderRadius: 24,
		borderWidth: 1,
	},
	score: {
		width: 44,
		height: 44,
		borderRadius: 22,
		borderWidth: 2,
		alignItems: "center",
		justifyContent: "center",
	},
	chips: { gap: 8, paddingVertical: 2 },
	chipsRow: { flexDirection: "row", gap: 8 },
	line: { flexDirection: "row", alignItems: "center", gap: 10 },
	block: { gap: 4 },
	aiHead: { flexDirection: "row", alignItems: "center", gap: 8 },
});
