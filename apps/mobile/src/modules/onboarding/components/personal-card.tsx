import { elevation } from "@personal-os/tokens";
import { StyleSheet, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";
import { Icon } from "@/components/icons";
import { Checkbox } from "@/components/ui/checkbox";
import { PoText } from "@/components/ui/po-text";
import { toShadowStyle, usePoTheme } from "@/theme";
import { formatThousands, waterGoalLiters } from "../lib/insights";
import { type ModuleOption, moduleOptions } from "../lib/options";
import { rhythmSegments } from "../lib/plan";
import { formatClock } from "../lib/time";
import { usePlan } from "../store/use-plan";
import { Avatar } from "./avatar";
import { ProgressRing, Spinner } from "./progress-ring";

const DAY = 24 * 60;
const GENDER_LABEL = { male: "Male", female: "Female", other: "Other" } as const;
const BAND_LABEL = {
	underweight: "low",
	healthy: "healthy",
	overweight: "high",
	obese: "high",
} as const;

/** Frame 15 "Personal card". `ready` is how many modules have finished building. */
export function PersonalCard({ ready }: { ready: number }) {
	const { colors } = usePoTheme();
	const plan = usePlan();
	const { answers } = plan;
	const modules = answers.modules
		.map((id) => moduleOptions.find((option) => option.id === id))
		.filter((option): option is ModuleOption => option !== undefined);
	const subtitle = [String(plan.age), answers.gender ? GENDER_LABEL[answers.gender] : null]
		.filter(Boolean)
		.join(" · ");

	const targets = [
		{
			id: "steps",
			value: formatThousands(8000),
			label: "steps",
			icon: "Footsteps",
			tone: "statusSuccess",
			tile: "statusSuccessSubtle",
		},
		{
			id: "kcal",
			value: formatThousands(plan.calories),
			label: "kcal",
			icon: "Food",
			tone: "statusCaution",
			tile: "statusCautionSubtle",
		},
		{
			id: "water",
			value: `${waterGoalLiters(answers.weightKg).toFixed(1)} L`,
			label: "water",
			icon: "Drop",
			tone: "accentDefault",
			tile: "accentSubtle",
		},
		{
			id: "sleep",
			value: plan.rhythm.sleep,
			label: "sleep",
			icon: "Moon",
			tone: "statusViolet",
			tile: "statusVioletSubtle",
		},
	] as const;

	const legend = [
		{ label: "Sleep", tone: "statusViolet" },
		{ label: "Plan", tone: "statusCaution" },
		{ label: "Work", tone: "accentDefault" },
		{ label: "Workout", tone: "statusDanger" },
	] as const;

	return (
		<View
			style={[
				styles.card,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
				toShadowStyle(elevation.card),
			]}
		>
			<View style={styles.spread}>
				<View style={styles.inline8}>
					<View style={[styles.dot8, { backgroundColor: colors.accentDefault }]} />
					<PoText variant="eyebrow11" tone="textSecondary">
						Personal card
					</PoText>
				</View>
				<PoText variant="mono13" tone="textTertiary">
					OS · 0001
				</PoText>
			</View>

			<View style={styles.who}>
				<Avatar name={answers.name} size={56} />
				<View style={styles.flex}>
					<PoText variant="title18" numberOfLines={1}>
						{answers.name.trim() || "You"}
					</PoText>
					<PoText variant="meta13" tone="textSecondary">
						{subtitle}
					</PoText>
				</View>
				<ProgressRing
					size={48}
					stroke={4}
					value={plan.completeness}
					label={`${Math.round(plan.completeness * 100)}%`}
				/>
			</View>

			<View style={styles.body}>
				<Stat value={String(answers.heightCm)} unit="cm" label="Height" />
				<Stat value={String(answers.weightKg)} unit="kg" label="Weight" />
				<Stat
					value={plan.bmi.toFixed(1)}
					label={`BMI · ${BAND_LABEL[plan.bmiBand]}`}
					labelTone={plan.bmiBand === "healthy" ? "textSuccess" : "textWarning"}
				/>
			</View>

			<View style={styles.section10}>
				<PoText variant="eyebrow11" tone="textTertiary">
					Daily targets
				</PoText>
				<View style={styles.spread}>
					{targets.map((target) => (
						<View key={target.id} style={styles.inline8}>
							<View style={[styles.tile28, { backgroundColor: colors[target.tile] }]}>
								<Icon name={target.icon} size={14} color={colors[target.tone]} />
							</View>
							<View>
								<PoText variant="row15">{target.value}</PoText>
								<PoText variant="meta13" tone="textTertiary">
									{target.label}
								</PoText>
							</View>
						</View>
					))}
				</View>
			</View>

			<View style={styles.section8}>
				<View style={styles.spread}>
					<PoText variant="eyebrow11" tone="textTertiary">
						Day rhythm
					</PoText>
					<PoText variant="mono13" tone="textSecondary">
						{`${formatClock(answers.wakeMinutes)} → ${formatClock(answers.bedMinutes)}`}
					</PoText>
				</View>
				<View style={[styles.bar, { backgroundColor: colors.bgSubtle }]}>
					{rhythmSegments(plan.input).map((segment) => (
						<View
							key={segment.id}
							style={[
								styles.segment,
								{
									left: `${(segment.start / DAY) * 100}%`,
									width: `${((segment.end - segment.start) / DAY) * 100}%`,
									backgroundColor: colors[segment.tone],
									borderRadius: segment.id === "plan" ? 4 : 6,
								},
							]}
						/>
					))}
				</View>
				<View style={styles.legend}>
					{legend.map((item) => (
						<View key={item.label} style={styles.inline6}>
							<View style={[styles.dot8, { backgroundColor: colors[item.tone] }]} />
							<PoText variant="meta13" tone="textSecondary">
								{item.label}
							</PoText>
						</View>
					))}
				</View>
			</View>

			<View style={[styles.divider, { backgroundColor: colors.borderDefault }]} />

			<View style={[styles.spread, styles.modulesRow]}>
				<View>
					<PoText variant="eyebrow11" tone="textTertiary">
						Modules
					</PoText>
					<PoText variant="meta13" tone="textSecondary">
						{`${Math.min(ready, modules.length)} of ${modules.length} ready`}
					</PoText>
				</View>
				<View style={styles.icons}>
					{modules.map((module, index) => (
						<View
							key={module.id}
							style={[styles.tile40, { backgroundColor: colors[module.tileTone] }]}
						>
							<Icon name={module.icon} color={colors[module.iconTone]} />
							{index < ready ? (
								<Animated.View
									entering={ZoomIn.springify().damping(14)}
									style={[styles.badge, { borderColor: colors.bgSurface }]}
								>
									<Checkbox checked size={20} />
								</Animated.View>
							) : index === ready ? (
								<View style={styles.pending} pointerEvents="none">
									<Spinner size={46} />
								</View>
							) : null}
						</View>
					))}
				</View>
			</View>
		</View>
	);
}

type StatProps = {
	value: string;
	unit?: string;
	label: string;
	labelTone?: "textSecondary" | "textSuccess" | "textWarning";
};

function Stat({ value, unit, label, labelTone = "textSecondary" }: StatProps) {
	const { colors } = usePoTheme();
	return (
		<View style={[styles.stat, { backgroundColor: colors.bgSubtle }]}>
			<View style={styles.number}>
				<PoText variant="title18">{value}</PoText>
				{unit ? (
					<PoText variant="meta13" tone="textTertiary">
						{unit}
					</PoText>
				) : null}
			</View>
			<PoText variant="meta13" tone={labelTone} numberOfLines={1}>
				{label}
			</PoText>
		</View>
	);
}

/** Bottom status line under the card while modules are added. */
export function BuildStatus({ label, busy }: { label: string; busy: boolean }) {
	const { colors } = usePoTheme();
	return (
		<View style={styles.inline8} accessibilityLiveRegion="polite">
			{busy ? <Spinner /> : <Icon name="Check bold" size={14} color={colors.statusSuccess} />}
			<PoText variant="meta13" tone="textSecondary">
				{label}
			</PoText>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		alignSelf: "stretch",
		gap: 16,
		paddingTop: 18,
		paddingBottom: 20,
		paddingHorizontal: 18,
		borderRadius: 32,
		borderWidth: 1,
	},
	flex: { flex: 1, gap: 2 },
	spread: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
	inline8: { flexDirection: "row", alignItems: "center", gap: 8 },
	inline6: { flexDirection: "row", alignItems: "center", gap: 6 },
	dot8: { width: 8, height: 8, borderRadius: 4 },
	who: { flexDirection: "row", alignItems: "center", gap: 14 },
	body: { flexDirection: "row", gap: 8 },
	stat: { flex: 1, gap: 2, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 18 },
	number: { flexDirection: "row", alignItems: "baseline", gap: 3 },
	section10: { gap: 10 },
	section8: { gap: 8 },
	tile28: {
		width: 28,
		height: 28,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
	},
	bar: { height: 16, borderRadius: 8, overflow: "hidden" },
	segment: { position: "absolute", top: 0, height: 16 },
	legend: { flexDirection: "row", gap: 14 },
	divider: { height: 1 },
	modulesRow: { paddingTop: 2, paddingBottom: 6 },
	icons: { flexDirection: "row", gap: 10, paddingRight: 4, paddingBottom: 4 },
	tile40: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
	},
	badge: { position: "absolute", right: -6, bottom: -4, borderWidth: 2, borderRadius: 12 },
	pending: { position: "absolute", left: -3, top: -3 },
});
