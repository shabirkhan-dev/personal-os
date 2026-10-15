import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { AiWorkingCard } from "@/components/ai-working-card";
import { Checkbox } from "@/components/ui/checkbox";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { useAiJob, useAiJobs } from "@/lib/ai-jobs/ai-jobs-store";
import { dayKey } from "@/lib/day";
import { usePoTheme } from "@/theme";
import { logSkillSession, removeSkillSession } from "../data/career-actions";
import { useCareer, useNow } from "../hooks/use-career";
import { SKILL_PATH_JOB, SKILL_PATH_STEPS } from "../hooks/use-career-jobs";
import {
	minutesThisMonth,
	planWeek,
	sessionFor,
	skillActivity,
	skillStreak,
	weekDone,
	weekdayIndex,
} from "../lib/career-math";
import type { SkillPlan } from "../lib/career-model";
import { careerRoutes } from "../navigation";
import { CareerScreen } from "./career-screen";
import {
	AiTip,
	EmptyCard,
	Footer,
	IconTile,
	ListCard,
	ListRow,
	MetaChip,
	ScreenTitle,
	Segments,
	SectionLabel,
	TimelineRow,
} from "./career-ui";
import { SkillFocusSheet, SkillTimerSheet } from "./skill-sheets";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri"];

type Sheet = "focus" | "timer" | null;

/** Today's plan day, or the first undone one this week at the weekend. */
function todaysDay(
	plan: SkillPlan,
	week: number,
	now: Date,
	done: (day: number) => boolean,
): number {
	const days = plan.weeks[week]?.days.length ?? 0;
	const today = weekdayIndex(now);
	if (today !== null && today < days) return today;
	const open = Array.from({ length: days }, (_, day) => day).find((day) => !done(day));
	return open ?? 0;
}

function useSkill() {
	const data = useCareer();
	const now = useNow();
	const { plan, sessions } = data;
	const week = plan ? planWeek(plan, now) : 0;
	const isDone = (day: number) => sessionFor(sessions, week, day)?.status === "done";
	const day = plan ? todaysDay(plan, week, now, isDone) : 0;
	return { data, now, plan, sessions, week, day, isDone, streak: skillStreak(sessions, now) };
}

/** The path being planned in the background, if any. */
function PlanningCard() {
	const job = useAiJob(SKILL_PATH_JOB);
	const retry = useAiJobs((state) => state.retry);
	const dismiss = useAiJobs((state) => state.dismiss);
	if (!job) return null;
	return (
		<AiWorkingCard
			job={job}
			steps={SKILL_PATH_STEPS}
			onRetry={() => retry(SKILL_PATH_JOB)}
			onDismiss={() => dismiss(SKILL_PATH_JOB)}
		/>
	);
}

/** Skill block: this week's five days, what comes next, and the 30-minute timer. */
export function SkillBlockScreen() {
	const { colors } = usePoTheme();
	const { data, now, plan, sessions, week, day, isDone, streak } = useSkill();
	const planning = useAiJob(SKILL_PATH_JOB) !== undefined;
	const [sheet, setSheet] = useState<Sheet>(null);

	if (!plan) {
		return (
			<CareerScreen>
				<ScreenTitle eyebrow="30 min a day" title="Skill block" />
				{planning ? (
					<PlanningCard />
				) : (
					<EmptyCard
						icon="Lightning"
						title={data.loading ? "Loading…" : "Pick a skill"}
						body="Choose one thing to get better at. I'll plan six weeks of 30-minute days around your applications."
					>
						<PillButton label="Pick a skill" onPress={() => setSheet("focus")} />
					</EmptyCard>
				)}
				{sheet === "focus" ? (
					<SkillFocusSheet visible apps={data.apps} onClose={() => setSheet(null)} />
				) : null}
			</CareerScreen>
		);
	}

	const thisWeek = plan.weeks[week];
	const doneCount = weekDone(sessions, week);
	const todayDone = sessions.some((session) => session.date === dayKey(now));
	const today = thisWeek?.days[day];

	const toggle = (index: number) => {
		const existing = sessionFor(sessions, week, index);
		const write = existing
			? removeSkillSession(existing.id)
			: logSkillSession({ week, day: index, minutes: 30, status: "done" });
		void write.catch((error: unknown) => console.error("[career] could not update the day", error));
	};

	return (
		<CareerScreen
			action={{ icon: "Filled/Edit", label: "Change plan", onPress: () => setSheet("focus") }}
		>
			<ScreenTitle
				eyebrow={`30 min a day · week ${week + 1} of ${plan.weeks.length}`}
				title="Skill block"
			>
				<MetaChip icon="Lightning" iconTone="statusCaution" label={`${streak}-day streak`} />
				<MetaChip icon="Clock" label={todayDone ? "Done today" : "30 min today"} />
				<MetaChip icon="Layers" label={plan.title} onPress={careerRoutes.skillPath} />
			</ScreenTitle>

			<PlanningCard />

			{thisWeek ? (
				<View
					style={[
						styles.card,
						{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
					]}
				>
					<View style={styles.head}>
						<PoText variant="title18" style={styles.flex}>
							This week
						</PoText>
						<PoText variant="meta13" tone="textSecondary">
							{doneCount} of {thisWeek.days.length} days
						</PoText>
					</View>
					<View style={styles.segments}>
						<Segments total={thisWeek.days.length} done={doneCount} />
					</View>
					{thisWeek.days.map((item, index) => (
						<ListRow
							key={`${week}-${item.title}`}
							title={`${DAY_NAMES[index] ?? `Day ${index + 1}`} · ${item.title}`}
							subtitle={item.detail}
							dimmed={isDone(index)}
							value={index === day && !isDone(index) ? "Today" : undefined}
							valueTone="accentDefault"
							leading={<Checkbox checked={isDone(index)} />}
							onPress={() => toggle(index)}
							last={index === thisWeek.days.length - 1}
						/>
					))}
				</View>
			) : null}

			{plan.weeks.length > week + 1 ? (
				<>
					<SectionLabel>Up next</SectionLabel>
					<ListCard>
						{plan.weeks.slice(week + 1, week + 4).map((item, index, list) => (
							<ListRow
								key={item.title + index}
								title={item.title}
								subtitle={item.goal || undefined}
								value={index === 0 ? "Next week" : "Later"}
								chevron
								onPress={careerRoutes.skillPath}
								last={index === list.length - 1}
							/>
						))}
					</ListCard>
				</>
			) : null}

			<AiTip>
				{today
					? `Today's block is ${today.title.toLowerCase()}. ${today.detail}`
					: "Pick up where you left off."}
			</AiTip>

			<Footer>
				<PillButton
					label="Change plan"
					variant="secondary"
					style={styles.flex}
					onPress={() => setSheet("focus")}
				/>
				<PillButton label="Start 30 min" style={styles.flex} onPress={() => setSheet("timer")} />
			</Footer>

			{sheet === "focus" ? (
				<SkillFocusSheet
					visible
					current={plan.title}
					apps={data.apps}
					onClose={() => setSheet(null)}
				/>
			) : null}
			{sheet === "timer" && today ? (
				<SkillTimerSheet
					visible
					title={today.title}
					detail={today.detail}
					week={week}
					day={day}
					onClose={() => setSheet(null)}
				/>
			) : null}
		</CareerScreen>
	);
}

/** The whole path: stats, week-by-week timeline and the last month of practice. */
export function SkillPathScreen() {
	const { colors } = usePoTheme();
	const { data, now, plan, sessions, week, day, streak } = useSkill();
	const [sheet, setSheet] = useState<Sheet>(null);

	if (!plan) {
		return (
			<CareerScreen>
				<ScreenTitle eyebrow="Skill path" title="No path yet" />
				<EmptyCard
					icon="Layers"
					title="Pick a skill first"
					body="Your six-week path shows here once it's planned."
				>
					<PillButton label="Pick a skill" onPress={() => setSheet("focus")} />
				</EmptyCard>
				{sheet === "focus" ? (
					<SkillFocusSheet visible apps={data.apps} onClose={() => setSheet(null)} />
				) : null}
			</CareerScreen>
		);
	}

	const minutes = minutesThisMonth(sessions, now);
	const cells = skillActivity(sessions, now, 30);
	const today = plan.weeks[week]?.days[day];
	const rows = [cells.slice(0, 10), cells.slice(10, 20), cells.slice(20, 30)];

	return (
		<CareerScreen
			action={{ icon: "Filled/Edit", label: "Edit path", onPress: () => setSheet("focus") }}
		>
			<ScreenTitle eyebrow={`Skill path · ${plan.weeks.length} weeks`} title={plan.title}>
				<MetaChip icon="Lightning" iconTone="statusCaution" label={`${streak}-day streak`} />
				<MetaChip
					icon="Clock"
					label={`${(minutes / 60).toFixed(1).replace(/\.0$/, "")} h this month`}
				/>
				<MetaChip icon="Layers" label={`Week ${week + 1} of ${plan.weeks.length}`} />
			</ScreenTitle>

			<View
				style={[
					styles.stats,
					{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
				]}
			>
				<Stat value={String(streak)} unit=" days" label="Streak" />
				<Stat value={String(sessions.length)} label="Sessions" />
				<Stat value={(minutes / 60).toFixed(1).replace(/\.0$/, "")} unit=" h" label="This month" />
			</View>

			<SectionLabel>Your path</SectionLabel>
			<View
				style={[
					styles.path,
					{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
				]}
			>
				{plan.weeks.map((item, index) => {
					const done = weekDone(sessions, index);
					const state = index < week ? "done" : index === week ? "next" : "later";
					return (
						<TimelineRow
							key={item.title + index}
							when={`Wk ${index + 1}`}
							title={item.title}
							note={
								index <= week
									? `${done} of ${item.days.length} days${index === week ? " · this week" : ""}`
									: item.goal || `${item.days.length} sessions`
							}
							state={state}
							last={index === plan.weeks.length - 1}
						/>
					);
				})}
			</View>

			<View
				style={[
					styles.activity,
					{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
				]}
			>
				<View style={styles.activityHead}>
					<IconTile name="Star" tone="textPrimary" tile="bgSubtle" />
					<PoText variant="body15" tone="textSecondary" style={styles.flex}>
						Skill activity
					</PoText>
					<PoText variant="meta13" tone="textSecondary">
						Last 30 days
					</PoText>
				</View>
				<View style={styles.grid}>
					{rows.map((row, rowIndex) => (
						<View
							// Rows are fixed positions in a 3 × 10 grid.
							// oxlint-disable-next-line react/no-array-index-key
							key={rowIndex}
							style={styles.gridRow}
						>
							{row.map((cell, cellIndex) => (
								<View
									// oxlint-disable-next-line react/no-array-index-key
									key={cellIndex}
									style={[
										styles.cell,
										cell === "done"
											? { backgroundColor: colors.textPrimary }
											: cell === "partial"
												? {
														backgroundColor: colors.bgSubtle,
														borderWidth: 1,
														borderStyle: "dashed",
														borderColor: colors.textTertiary,
													}
												: { backgroundColor: colors.bgSubtle },
									]}
								/>
							))}
						</View>
					))}
				</View>
				<View style={styles.legend}>
					<Legend label="Done" style={{ backgroundColor: colors.textPrimary }} />
					<Legend
						label="Partial"
						style={{
							backgroundColor: colors.bgSubtle,
							borderWidth: 1,
							borderStyle: "dashed",
							borderColor: colors.textTertiary,
						}}
					/>
					<Legend label="Missed" style={{ backgroundColor: colors.bgSubtle }} />
				</View>
			</View>

			<AiTip>
				{week + 1 < plan.weeks.length
					? `Week ${week + 2} is ${plan.weeks[week + 1]?.title.toLowerCase()}. Keep the streak going into it.`
					: "Last week of the path. Finish the demo and add it to your CV."}
			</AiTip>

			<Footer>
				<PillButton
					label="Edit path"
					variant="secondary"
					style={styles.flex}
					onPress={() => setSheet("focus")}
				/>
				<PillButton
					label="Start today's 30 min"
					style={styles.flex}
					disabled={!today}
					onPress={() => setSheet("timer")}
				/>
			</Footer>

			{sheet === "focus" ? (
				<SkillFocusSheet
					visible
					current={plan.title}
					apps={data.apps}
					onClose={() => setSheet(null)}
				/>
			) : null}
			{sheet === "timer" && today ? (
				<SkillTimerSheet
					visible
					title={today.title}
					detail={today.detail}
					week={week}
					day={day}
					onClose={() => setSheet(null)}
				/>
			) : null}
		</CareerScreen>
	);
}

function Stat({ value, unit, label }: { value: string; unit?: string; label: string }) {
	return (
		<View style={styles.stat}>
			<PoText variant="title18">
				{value}
				{unit ? (
					<PoText variant="meta13" tone="textSecondary">
						{unit}
					</PoText>
				) : null}
			</PoText>
			<PoText variant="meta13" tone="textSecondary">
				{label}
			</PoText>
		</View>
	);
}

function Legend({ label, style }: { label: string; style: object }) {
	return (
		<View style={styles.legendItem}>
			<PoText variant="meta13" tone="textSecondary">
				{label}
			</PoText>
			<View style={[styles.legendSwatch, style]} />
		</View>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	card: {
		paddingTop: 16,
		paddingBottom: 4,
		paddingHorizontal: 16,
		borderRadius: 28,
		borderWidth: 1,
	},
	head: { flexDirection: "row", alignItems: "center" },
	segments: { paddingTop: 10, paddingBottom: 6 },
	stats: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		paddingVertical: 18,
		borderRadius: 28,
		borderWidth: 1,
	},
	stat: { alignItems: "center", gap: 4 },
	path: {
		gap: 4,
		paddingTop: 14,
		paddingBottom: 6,
		paddingHorizontal: 16,
		borderRadius: 28,
		borderWidth: 1,
	},
	activity: { gap: 18, padding: 20, borderRadius: 28, borderWidth: 1 },
	activityHead: { flexDirection: "row", alignItems: "center", gap: 12 },
	grid: { gap: 6 },
	gridRow: { flexDirection: "row", gap: 5 },
	cell: { flex: 1, height: 18, borderRadius: 9 },
	legend: { flexDirection: "row", gap: 16 },
	legendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
	legendSwatch: { width: 26, height: 14, borderRadius: 7 },
});
