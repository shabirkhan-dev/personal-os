import { StyleSheet, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";
import { Icon } from "@/components/icons";
import { Checkbox } from "@/components/ui/checkbox";
import { PoText } from "@/components/ui/po-text";
import { SelectCard } from "@/components/ui/select-card";
import { AiInsight } from "@/modules/onboarding/components/ai-insight";
import type { RichPart } from "@/modules/onboarding/components/rich-text";
import { SetupFrame } from "@/modules/onboarding/components/setup-frame";
import { onboardingRoutes } from "@/modules/onboarding/lib/flow";
import { type GoalId, type GoalOption, goalOptions } from "@/modules/onboarding/lib/options";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { usePoTheme } from "@/theme";

function focusOf(goal: GoalId): string {
	return goalOptions.find((option) => option.id === goal)?.focus ?? goal;
}

/** "Plan built around: weight first, then savings, then skin." */
function planSentence(goals: readonly GoalId[]): RichPart[] {
	if (goals.length === 0) return ["Pick what matters most and your plan will follow it."];
	const parts: RichPart[] = ["Plan built around: ", [`${focusOf(goals[0])} first`]];
	for (const goal of goals.slice(1)) parts.push(", then ", [focusOf(goal)]);
	parts.push(".");
	return parts;
}

/** 11 Setup 4 · Goals: pick up to three, ranked by the order they were picked. */
export default function GoalsScreen() {
	const goals = useOnboardingStore((state) => state.goals);
	const toggleGoal = useOnboardingStore((state) => state.toggleGoal);
	const syncModulesWithGoals = useOnboardingStore((state) => state.syncModulesWithGoals);
	const rows = [0, 2, 4, 6].map((start) => goalOptions.slice(start, start + 2));

	return (
		<SetupFrame
			step={4}
			route={onboardingRoutes.goals}
			title="What matters most?"
			body={["Pick up to 3, in order. The first one matters most."]}
			gap={18}
			onContinue={syncModulesWithGoals}
		>
			<View style={styles.grid}>
				{rows.map((row) => (
					<View key={row[0].id} style={styles.row}>
						{row.map((option) => (
							<GoalCard
								key={option.id}
								option={option}
								rank={goals.indexOf(option.id) + 1}
								onPress={() => toggleGoal(option.id)}
							/>
						))}
					</View>
				))}
			</View>
			<View style={styles.gap12} />
			<AiInsight parts={planSentence(goals)} />
		</SetupFrame>
	);
}

function GoalCard({
	option,
	rank,
	onPress,
}: {
	option: GoalOption;
	rank: number;
	onPress: () => void;
}) {
	const { colors } = usePoTheme();
	const selected = rank > 0;

	return (
		<SelectCard
			selected={selected}
			onPress={onPress}
			radius={24}
			accessibilityLabel={selected ? `${option.label}, priority ${rank}` : option.label}
			style={styles.card}
		>
			<View style={styles.top}>
				<View style={[styles.tile, { backgroundColor: colors[option.tileTone] }]}>
					<Icon name={option.icon} color={colors[option.iconTone]} />
				</View>
				{selected ? (
					<Animated.View
						key={rank}
						entering={ZoomIn.springify().damping(14)}
						style={[styles.rank, { backgroundColor: colors.accentDefault }]}
					>
						<PoText variant="row15" tone="textOnAccent">
							{rank}
						</PoText>
					</Animated.View>
				) : (
					<Checkbox checked={false} size={28} />
				)}
			</View>
			<PoText variant="row15" tone={selected ? "textPrimary" : "textSecondary"}>
				{option.label}
			</PoText>
		</SelectCard>
	);
}

const styles = StyleSheet.create({
	grid: { gap: 10 },
	row: { flexDirection: "row", gap: 10 },
	card: { flex: 1, gap: 12, paddingTop: 14, paddingBottom: 16, paddingHorizontal: 14 },
	top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
	tile: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
	rank: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
	gap12: { height: 12 },
});
