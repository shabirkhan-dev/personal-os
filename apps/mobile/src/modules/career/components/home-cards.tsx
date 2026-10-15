import type { ColorTokens } from "@personal-os/tokens";
import { Pressable, StyleSheet, View } from "react-native";
import type { IconName } from "@/components/icons";
import { PoText } from "@/components/ui/po-text";
import { usePoTheme } from "@/theme";
import {
	type ActivityItem,
	dayAndTime,
	type FollowUp,
	PIPELINE_STAGES,
	type PipelineStage,
	weekdayShort,
} from "../lib/career-math";
import type { CareerEventKind } from "../lib/career-model";
import { ActionPills, HeadLink, ListCard, ListRow } from "@/components/module-ui";

type Tone = keyof ColorTokens;

export const STAGE_TONE: Record<PipelineStage, Tone> = {
	saved: "statusCaution",
	applied: "accentDefault",
	interview: "statusViolet",
	offer: "statusSuccess",
};

const STAGE_NAMES: Record<PipelineStage, string> = {
	saved: "Saved",
	applied: "Applied",
	interview: "Interview",
	offer: "Offer",
};

/** Add job / Follow up / Prep under the ask bar. */
export function QuickActions({
	onAdd,
	onFollowUp,
	onPrep,
}: {
	onAdd: () => void;
	onFollowUp: () => void;
	onPrep: () => void;
}) {
	return (
		<ActionPills
			actions={[
				{ label: "Add job", icon: "Filled/Plus", onPress: onAdd },
				{ label: "Follow up", icon: "Send", onPress: onFollowUp },
				{ label: "Prep", icon: "Briefcase", onPress: onPrep },
			]}
		/>
	);
}

/** Stage split bar, legend and today's line. */
export function PipelineCard({
	counts,
	appliedThisWeek,
	weeklyTarget,
	todayLine,
	onPress,
}: {
	counts: Record<PipelineStage, number>;
	appliedThisWeek: number;
	weeklyTarget: number;
	todayLine: string;
	onPress: () => void;
}) {
	const { colors } = usePoTheme();
	const total = PIPELINE_STAGES.reduce((sum, stage) => sum + counts[stage], 0);
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={`Pipeline, ${appliedThisWeek} of ${weeklyTarget} applied this week`}
			onPress={onPress}
			style={[
				styles.card,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			<View style={styles.head}>
				<PoText variant="title18">Pipeline</PoText>
				<View style={styles.value}>
					<PoText variant="row15">{appliedThisWeek}</PoText>
					<PoText variant="meta13" tone="textTertiary">
						/ {weeklyTarget} applied this week
					</PoText>
				</View>
			</View>
			<View style={[styles.split, { backgroundColor: colors.bgSubtle }]}>
				{total > 0
					? PIPELINE_STAGES.filter((stage) => counts[stage] > 0).map((stage) => (
							<View
								key={stage}
								style={{ flex: counts[stage], backgroundColor: colors[STAGE_TONE[stage]] }}
							/>
						))
					: null}
			</View>
			<View style={styles.legend}>
				{PIPELINE_STAGES.map((stage) => (
					<View key={stage} style={styles.legendItem}>
						<View style={[styles.legendDot, { backgroundColor: colors[STAGE_TONE[stage]] }]} />
						<PoText variant="meta13" tone="textSecondary">
							{STAGE_NAMES[stage]} {counts[stage]}
						</PoText>
					</View>
				))}
			</View>
			<PoText variant="meta13" tone="textTertiary">
				{todayLine}
			</PoText>
		</Pressable>
	);
}

const FOLLOW_UP_ICONS: ReadonlyArray<{ name: IconName; tone: Tone; tile: Tone }> = [
	{ name: "Send", tone: "statusCaution", tile: "statusCautionSubtle" },
	{ name: "Chat", tone: "accentDefault", tile: "accentSubtle" },
	{ name: "Briefcase", tone: "statusViolet", tile: "statusVioletSubtle" },
];

/** Applications waiting on a reply: a Nudge button when due, the day otherwise. */
export function FollowUpsCard({
	items,
	now,
	onNudge,
	onOpen,
	onAll,
}: {
	items: readonly FollowUp[];
	now: Date;
	onNudge: (id: string) => void;
	onOpen: (id: string) => void;
	onAll: () => void;
}) {
	const due = items.filter((item) => item.due).length;
	const shown = items.slice(0, 3);
	return (
		<ListCard title="Follow-ups due" right={<HeadLink label={`${due} due`} onPress={onAll} />}>
			{shown.map((item, index) => {
				const since =
					item.daysSinceApplied === null
						? ""
						: item.daysSinceApplied === 0
							? " · today"
							: ` · ${item.daysSinceApplied} day${item.daysSinceApplied === 1 ? "" : "s"} ago`;
				const overdueDays = Math.round((now.getTime() - item.dueAt.getTime()) / 86_400_000);
				return (
					<ListRow
						key={item.app.id}
						title={item.app.company}
						subtitle={
							item.due
								? `${item.app.role || "Application"}${since}`
								: `${item.app.role || "Application"} · follow up ${weekdayShort(item.dueAt)}`
						}
						icon={FOLLOW_UP_ICONS[index % FOLLOW_UP_ICONS.length]}
						action={
							index === 0 && item.due
								? { label: "Nudge", onPress: () => onNudge(item.app.id) }
								: undefined
						}
						value={
							item.due
								? overdueDays > 0 && item.daysSinceApplied !== null
									? `Day ${item.daysSinceApplied}`
									: "Today"
								: weekdayShort(item.dueAt)
						}
						onPress={() => onOpen(item.app.id)}
						last={index === shown.length - 1}
					/>
				);
			})}
		</ListCard>
	);
}

const ACTIVITY_LOOK: Record<
	CareerEventKind,
	{ icon: IconName; tone: Tone; tile: Tone; label: string; valueTone: Tone }
> = {
	saved: {
		icon: "Briefcase",
		tone: "accentDefault",
		tile: "accentSubtle",
		label: "Saved",
		valueTone: "textPrimary",
	},
	applied: {
		icon: "Send",
		tone: "statusCaution",
		tile: "statusCautionSubtle",
		label: "Applied",
		valueTone: "textPrimary",
	},
	nudged: {
		icon: "Chat",
		tone: "accentDefault",
		tile: "accentSubtle",
		label: "Nudged",
		valueTone: "textPrimary",
	},
	interview: {
		icon: "Filled/Calendar",
		tone: "statusSuccess",
		tile: "statusSuccessSubtle",
		label: "Interview",
		valueTone: "textSuccess",
	},
	offer: {
		icon: "Star",
		tone: "statusSuccess",
		tile: "statusSuccessSubtle",
		label: "Offer",
		valueTone: "textSuccess",
	},
	closed: {
		icon: "Line/Close",
		tone: "textTertiary",
		tile: "bgSubtle",
		label: "Closed",
		valueTone: "textTertiary",
	},
};

/** The newest steps across all applications. */
export function ActivityCard({
	items,
	onOpen,
	onAll,
}: {
	items: readonly ActivityItem[];
	onOpen: (id: string) => void;
	onAll: () => void;
}) {
	return (
		<ListCard title="Activity" right={<HeadLink label="All" onPress={onAll} />}>
			{items.map((item, index) => {
				const look = ACTIVITY_LOOK[item.kind];
				const title =
					item.kind === "interview" ? "Interview booked" : `${look.label} · ${item.company}`;
				const subtitle =
					item.kind === "interview"
						? `${item.company}${item.note ? ` · ${item.note}` : ""}`
						: [item.role, item.where].filter(Boolean).join(" · ");
				return (
					<ListRow
						key={`${item.appId}-${item.at.toISOString()}-${item.kind}`}
						title={title}
						subtitle={subtitle || undefined}
						icon={{ name: look.icon, tone: look.tone, tile: look.tile }}
						value={look.label}
						valueTone={look.valueTone}
						onPress={() => onOpen(item.appId)}
						last={index === items.length - 1}
					/>
				);
			})}
		</ListCard>
	);
}

export function interviewTitle(company: string, at: string): string {
	return `${company} · ${dayAndTime(new Date(at)).replace(",", "")}`;
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	quick: { flexDirection: "row", gap: 8 },
	quickButton: {
		flex: 1,
		height: 44,
		borderRadius: 22,
		borderWidth: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
	},
	card: { gap: 12, padding: 16, borderRadius: 28, borderWidth: 1 },
	head: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
	value: { flexDirection: "row", alignItems: "baseline", gap: 4 },
	split: { height: 10, borderRadius: 5, overflow: "hidden", flexDirection: "row" },
	legend: { flexDirection: "row", flexWrap: "wrap", columnGap: 14, rowGap: 8 },
	legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
	legendDot: { width: 8, height: 8, borderRadius: 4 },
	progressHead: { flexDirection: "row", alignItems: "center", gap: 12 },
	result: {
		gap: 10,
		paddingHorizontal: 16,
		paddingVertical: 14,
		borderRadius: 28,
		borderWidth: 1.5,
	},
	eyebrow: { flexDirection: "row", alignItems: "center", gap: 8 },
	footer: { flexDirection: "row", gap: 10 },
});
