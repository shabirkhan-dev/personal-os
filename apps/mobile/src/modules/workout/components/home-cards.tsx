import type { ColorTokens } from "@personal-os/tokens";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon, type IconName } from "@/components/icons";
import { FilterChip, ProgressBar } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { clockOf } from "@/modules/home/lib/module-day";
import { usePoTheme } from "@/theme";
import type { Template } from "../lib/library";
import type { Best, SlotState } from "../lib/training-math";
import { SPORT_LABELS, type Sport } from "../lib/training-model";
import { TrainingImage } from "./training-image";

type Tone = keyof ColorTokens;

export const SPORT_TONES: Record<Sport, Tone> = {
	calisthenics: "accentDefault",
	running: "statusSuccess",
	boxing: "statusDanger",
	yoga: "textTertiary",
	football: "statusCaution",
	volleyball: "statusCaution",
	gym: "statusViolet",
	swimming: "accentDefault",
	walk: "statusSuccess",
	cycle: "statusSuccess",
	other: "textTertiary",
};

export function Card({ children, accent = false }: { children: ReactNode; accent?: boolean }) {
	const { colors } = usePoTheme();
	return (
		<View
			style={[
				styles.card,
				{
					backgroundColor: colors.bgSurface,
					borderColor: accent ? colors.accentDefault : colors.borderDefault,
				},
			]}
		>
			{children}
		</View>
	);
}

export function CardHead({ title, right }: { title: string; right?: string }) {
	return (
		<View style={styles.head}>
			<PoText variant="title18" style={styles.flex}>
				{title}
			</PoText>
			{right ? (
				<PoText variant="meta13" tone="textSecondary">
					{right}
				</PoText>
			) : null}
		</View>
	);
}

/** "TODAY · 18:30 / Push + handstand / 7 exercises · 45 min" with a big play button. */
export function TodayCard({
	template,
	at,
	done,
	onOpen,
	onStart,
}: {
	template: Template;
	at: number;
	done: boolean;
	onOpen: () => void;
	onStart: () => void;
}) {
	const { colors } = usePoTheme();
	const detail =
		template.sport === "running"
			? `${template.distanceKm ?? 5} km · about ${template.minutes} min`
			: template.sport === "boxing"
				? `${template.rounds} × ${template.roundMin} min rounds`
				: `${template.exercises.length} exercises · ${template.minutes} min`;
	return (
		<Pressable
			accessibilityRole="button"
			onPress={onOpen}
			style={[
				styles.today,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			<TrainingImage photo={template.photo} size={60} radius={16} />
			<View style={styles.flex}>
				<PoText variant="eyebrow11" tone={done ? "textSuccess" : "textTertiary"}>
					{done ? "Today · done" : `Today · ${clockOf(at)}`}
				</PoText>
				<PoText variant="title18" numberOfLines={1}>
					{template.title}
				</PoText>
				<PoText variant="meta13" tone="textSecondary">
					{detail}
				</PoText>
			</View>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={`Start ${template.title}`}
				onPress={() => {
					haptics.tap();
					onStart();
				}}
				style={[styles.play, { backgroundColor: colors.bgInverse }]}
			>
				<Icon name={done ? "Line/Check" : "Filled/Play"} size={22} color={colors.textInverse} />
			</Pressable>
		</Pressable>
	);
}

/** Monday to Sunday: ticks for done, a ring for today, a dot for planned or rest. */
export function WeekDotsCard({
	cells,
	goal,
	onPress,
}: {
	cells: readonly { day: string; letter: string; state: SlotState }[];
	goal: number;
	onPress: () => void;
}) {
	const { colors } = usePoTheme();
	return (
		<Pressable
			accessibilityRole="button"
			onPress={onPress}
			style={[
				styles.card,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			<CardHead title="This week" right={`Goal ${goal} sessions`} />
			<View style={styles.week}>
				{cells.map((cell) => (
					<View key={cell.day} style={styles.weekDay}>
						<PoText
							variant="mono13"
							tone={cell.state === "today" ? "accentDefault" : "textTertiary"}
						>
							{cell.letter}
						</PoText>
						<View
							style={[
								styles.weekDot,
								cell.state === "done"
									? { backgroundColor: colors.accentDefault }
									: cell.state === "today"
										? { borderWidth: 1.5, borderColor: colors.accentDefault }
										: { backgroundColor: colors.bgSubtle },
							]}
						>
							{cell.state === "done" ? (
								<Icon name="Line/Check" size={14} color={colors.textOnAccent} />
							) : (
								<View
									style={[
										styles.dot,
										{
											backgroundColor:
												cell.state === "missed"
													? colors.statusCaution
													: cell.state === "today"
														? colors.accentDefault
														: colors.textTertiary,
										},
									]}
								/>
							)}
						</View>
					</View>
				))}
			</View>
		</Pressable>
	);
}

export type ActivityRow = {
	icon: IconName;
	tone: Tone;
	tile: Tone;
	label: string;
	value: number;
	goal: number;
	unit: string;
};

/** Steps, active kcal and move minutes against their goals. */
export function ActivityCard({ rows, source }: { rows: readonly ActivityRow[]; source: string }) {
	const { colors } = usePoTheme();
	return (
		<Card>
			<CardHead title="Activity today" right={source} />
			{rows.map((row) => (
				<View key={row.label} style={styles.activity}>
					<View style={[styles.tile, { backgroundColor: colors[row.tile] }]}>
						<Icon name={row.icon} size={16} color={colors[row.tone]} />
					</View>
					<View style={styles.flex}>
						<View style={styles.activityHead}>
							<PoText variant="meta13" tone="textSecondary" style={styles.flex}>
								{row.label}
							</PoText>
							<PoText variant="row15">
								{row.value.toLocaleString("en-US")}
								<PoText variant="meta13" tone="textTertiary">
									{` / ${row.goal.toLocaleString("en-US")}${row.unit}`}
								</PoText>
							</PoText>
						</View>
						<ProgressBar share={row.goal > 0 ? row.value / row.goal : 0} tone={row.tone} />
					</View>
				</View>
			))}
		</Card>
	);
}

/** The last few sessions: day, title and its line. */
export function RecentCard({
	rows,
	count,
	onRow,
}: {
	rows: readonly { id: string; day: string; title: string; line: string; tone: Tone }[];
	count: number;
	onRow: (id: string) => void;
}) {
	const { colors } = usePoTheme();
	return (
		<Card>
			<CardHead title="Recent sessions" right={`${count} this week`} />
			{rows.map((row) => (
				<Pressable
					key={row.id}
					accessibilityRole="button"
					onPress={() => onRow(row.id)}
					style={styles.recent}
				>
					<PoText variant="mono13" tone={row.tone} style={styles.recentDay}>
						{row.day}
					</PoText>
					<View style={styles.flex}>
						<PoText variant="row15">{row.title}</PoText>
						<PoText variant="meta13" tone="textSecondary">
							{row.line}
						</PoText>
					</View>
					<Icon name="Line/Chevron right" size={16} color={colors.textTertiary} />
				</Pressable>
			))}
		</Card>
	);
}

export function BestsRow({ bests }: { bests: readonly Best[] }) {
	const { colors } = usePoTheme();
	return (
		<View style={styles.section}>
			<PoText variant="eyebrow11" tone="textTertiary" style={styles.label}>
				Personal bests
			</PoText>
			<View style={styles.bests}>
				{bests.map((best) => (
					<View
						key={best.label}
						style={[
							styles.best,
							{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
						]}
					>
						<View style={styles.bestHead}>
							<Icon name="Star" size={14} color={colors.statusCaution} />
							<PoText variant="meta13" tone="textSecondary">
								{best.label}
							</PoText>
						</View>
						<PoText variant="title18">{best.value}</PoText>
						<PoText variant="mono13" tone="textSuccess">
							{best.change ?? (best.fresh ? "new" : "–")}
						</PoText>
					</View>
				))}
			</View>
		</View>
	);
}

const PHASE_TEXT: Record<1 | 2 | 3, { title: string; body: string }> = {
	1: {
		title: "Phase 1 · until the new job",
		body: "Bodyweight, running and shadow boxing. The gym and a boxing club unlock in phase 2.",
	},
	2: {
		title: "Phase 2 · gym and clubs",
		body: "Gym, a boxing club and a team sport, on top of the basics.",
	},
	3: { title: "Phase 3 · new skills", body: "Swimming lessons, then skiing." },
};

const LATER: Record<1 | 2 | 3, string[]> = {
	1: ["Gym", "Football", "Swimming"],
	2: ["Swimming", "Skiing"],
	3: [],
};

/** What this phase trains, and what comes later. */
export function PhaseCard({ phase, sports }: { phase: 1 | 2 | 3; sports: readonly Sport[] }) {
	const { colors } = usePoTheme();
	return (
		<View style={[styles.card, { backgroundColor: colors.bgSubtle, borderColor: colors.bgSubtle }]}>
			<PoText variant="eyebrow11" tone="textTertiary">
				{PHASE_TEXT[phase].title}
			</PoText>
			<PoText variant="meta13" tone="textSecondary">
				{PHASE_TEXT[phase].body}
			</PoText>
			<View style={styles.tags}>
				{sports.map((sport) => (
					<View key={sport} style={styles.tag}>
						<View style={[styles.dot, { backgroundColor: colors[SPORT_TONES[sport]] }]} />
						<PoText variant="meta13">{SPORT_LABELS[sport]}</PoText>
					</View>
				))}
				{LATER[phase]
					.filter((name) => !sports.some((sport) => SPORT_LABELS[sport] === name))
					.map((name) => (
						<View key={name} style={styles.tag}>
							<View style={[styles.dot, { backgroundColor: colors.textTertiary }]} />
							<PoText variant="meta13" tone="textTertiary">{`${name} · later`}</PoText>
						</View>
					))}
			</View>
		</View>
	);
}

const PICKABLE: readonly { sport: Sport; photo: string }[] = [
	{ sport: "calisthenics", photo: "handstand" },
	{ sport: "running", photo: "mountain-run" },
	{ sport: "boxing", photo: "shadow-boxing" },
	{ sport: "football", photo: "football" },
	{ sport: "volleyball", photo: "volleyball" },
	{ sport: "yoga", photo: "yoga" },
];

/** The empty Home: what you train (photos), days a week, Build my first week. */
export function SetupCard({
	sports,
	days,
	busy,
	onSport,
	onDays,
	onBuild,
}: {
	sports: readonly Sport[];
	days: number;
	busy: boolean;
	onSport: (sport: Sport) => void;
	onDays: (days: number) => void;
	onBuild: () => void;
}) {
	const { colors } = usePoTheme();
	return (
		<Card>
			<PoText variant="eyebrow11" tone="textTertiary">
				What do you train?
			</PoText>
			<PoText variant="title18">Pick everything you do now</PoText>
			<View style={styles.grid}>
				{PICKABLE.map((item) => {
					const on = sports.includes(item.sport);
					return (
						<Pressable
							key={item.sport}
							accessibilityRole="checkbox"
							accessibilityState={{ checked: on }}
							onPress={() => {
								haptics.select();
								onSport(item.sport);
							}}
							style={styles.pick}
						>
							<TrainingImage
								photo={item.photo}
								size={88}
								fill
								radius={16}
								style={
									on
										? { borderWidth: 2, borderColor: colors[SPORT_TONES[item.sport]] }
										: { opacity: 0.55 }
								}
							/>
							<PoText variant="meta13" tone={on ? "textPrimary" : "textTertiary"}>
								{SPORT_LABELS[item.sport]}
							</PoText>
						</Pressable>
					);
				})}
			</View>
			<View style={styles.days}>
				<PoText variant="row15" style={styles.flex}>
					Days a week
				</PoText>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Fewer days"
					hitSlop={10}
					onPress={() => onDays(Math.max(1, days - 1))}
				>
					<Icon name="Minus" size={18} color={colors.textPrimary} />
				</Pressable>
				<PoText variant="row15">{days}</PoText>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="More days"
					hitSlop={10}
					onPress={() => onDays(Math.min(7, days + 1))}
				>
					<Icon name="Line/Plus" size={18} color={colors.textPrimary} />
				</Pressable>
			</View>
			<PoText variant="meta13" tone="textSecondary">
				No gym yet, so phase 1 starts with bodyweight, runs and shadow boxing.
			</PoText>
			<PillButton
				label={busy ? "Building…" : "Build my first week"}
				disabled={busy || sports.length === 0}
				onPress={onBuild}
			/>
		</Card>
	);
}

/** The Training AI's answer. */
export function TrainingAnswerCard({
	question,
	answer,
	followUps,
	onFollowUp,
	onDone,
}: {
	question: string;
	answer: string;
	followUps: readonly string[];
	onFollowUp: (question: string) => void;
	onDone: () => void;
}) {
	const { colors } = usePoTheme();
	return (
		<Card accent>
			<View style={styles.head}>
				<Icon name="Filled/Sparkle" size={14} color={colors.accentDefault} />
				<PoText variant="eyebrow11" tone="textTertiary">
					Answer
				</PoText>
			</View>
			<PoText variant="mono13" tone="textSecondary">
				“{question}”
			</PoText>
			<PoText variant="body15">{answer}</PoText>
			{followUps.length > 0 ? (
				<View style={styles.tags}>
					{followUps.map((item) => (
						<FilterChip key={item} label={item} selected={false} onPress={() => onFollowUp(item)} />
					))}
				</View>
			) : null}
			<PillButton label="Done" variant="secondary" onPress={onDone} />
		</Card>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	card: { gap: 12, padding: 18, borderRadius: 28, borderWidth: 1 },
	head: { flexDirection: "row", alignItems: "center", gap: 8 },
	today: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		padding: 10,
		borderRadius: 28,
		borderWidth: 1,
	},
	play: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
	week: { flexDirection: "row", justifyContent: "space-between" },
	weekDay: { alignItems: "center", gap: 8 },
	weekDot: {
		width: 28,
		height: 28,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
	},
	dot: { width: 6, height: 6, borderRadius: 3 },
	activity: { flexDirection: "row", alignItems: "center", gap: 12 },
	activityHead: { flexDirection: "row", alignItems: "baseline", paddingBottom: 6 },
	tile: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
	recent: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
	recentDay: { width: 36 },
	section: { gap: 8 },
	label: { paddingHorizontal: 6 },
	bests: { flexDirection: "row", gap: 8 },
	best: { flex: 1, gap: 4, padding: 14, borderRadius: 22, borderWidth: 1 },
	bestHead: { flexDirection: "row", alignItems: "center", gap: 6 },
	tags: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
	tag: { flexDirection: "row", alignItems: "center", gap: 6 },
	grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	pick: { width: "31.5%", gap: 6 },
	days: { flexDirection: "row", alignItems: "center", gap: 16 },
});
