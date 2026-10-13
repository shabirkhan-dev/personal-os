import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { Icon } from "@/components/icons";
import { HeaderButton } from "@/components/ui/header-button";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { OnboardingScreen } from "@/modules/onboarding/components/onboarding-screen";
import { TextBlock } from "@/modules/onboarding/components/text-block";
import { onboardingRoutes } from "@/modules/onboarding/lib/flow";
import { buildDayPlan, planHighlights } from "@/modules/onboarding/lib/plan";
import { usePlan } from "@/modules/onboarding/store/use-plan";
import { rise, usePoTheme } from "@/theme";

/** 16 Plan reveal */
export default function PlanRevealScreen() {
	const { colors } = usePoTheme();
	const plan = usePlan();
	const rows = buildDayPlan(plan.input);
	const highlights = planHighlights(plan.input);

	return (
		<OnboardingScreen
			glow="statusSuccess"
			scroll
			footer={
				<>
					<PillButton label="Save my plan" onPress={() => router.push(onboardingRoutes.signIn)} />
					<PoText variant="meta13" tone="textTertiary" style={styles.center}>
						Next: create your account to sync it
					</PoText>
				</>
			}
		>
			<View style={styles.top}>
				<HeaderButton icon="Filled/Back" accessibilityLabel="Back" onPress={() => router.back()} />
				<View style={[styles.progress, { backgroundColor: colors.textPrimary }]} />
				<View style={styles.balance} />
			</View>
			<View style={styles.gap22} />
			<TextBlock
				dot="statusSuccess"
				compact
				eyebrow="Your plan is ready"
				title="Here's your first day"
				body={["Built from your answers. Change anything later."]}
			/>
			<View style={styles.gap18} />
			<View
				style={[
					styles.day,
					{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
				]}
			>
				{rows.map((row, index) => (
					<Animated.View
						key={`${row.time}-${row.title}`}
						entering={rise(70 * index)}
						style={[
							styles.row,
							index < rows.length - 1
								? { borderBottomWidth: 1, borderBottomColor: colors.borderDefault }
								: null,
						]}
					>
						<PoText variant="mono13" tone="textTertiary" style={styles.time}>
							{row.time}
						</PoText>
						<View style={[styles.tile32, { backgroundColor: colors.bgSubtle }]}>
							<Icon name={row.icon} size={16} color={colors[row.iconTone]} />
						</View>
						<PoText variant="row15" style={styles.flex} numberOfLines={1}>
							{row.title}
						</PoText>
						<PoText variant="meta13" tone="textSecondary">
							{row.meta}
						</PoText>
					</Animated.View>
				))}
			</View>
			<View style={styles.gap12} />
			<View style={styles.goals}>
				{highlights.map((tile, index) => (
					<Animated.View
						key={tile.label}
						entering={rise(450 + 80 * index)}
						style={[
							styles.goal,
							{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
						]}
					>
						<View style={[styles.tile28, { backgroundColor: colors[tile.tileTone] }]}>
							<Icon name={tile.icon} size={14} color={colors[tile.iconTone]} />
						</View>
						<View>
							<PoText variant="title18">{tile.value}</PoText>
							<PoText variant="meta13" tone="textSecondary">
								{tile.label}
							</PoText>
						</View>
					</Animated.View>
				))}
			</View>
		</OnboardingScreen>
	);
}

const styles = StyleSheet.create({
	top: { height: 40, flexDirection: "row", alignItems: "center", gap: 14 },
	progress: { flex: 1, height: 4, borderRadius: 2 },
	balance: { width: 40 },
	gap22: { height: 22 },
	gap18: { height: 18 },
	gap12: { height: 12 },
	center: { textAlign: "center" },
	flex: { flex: 1 },
	day: { paddingHorizontal: 18, paddingVertical: 6, borderRadius: 28, borderWidth: 1 },
	row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
	time: { width: 44 },
	tile32: {
		width: 32,
		height: 32,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
	},
	goals: { flexDirection: "row", gap: 8 },
	goal: { flex: 1, gap: 8, padding: 12, borderRadius: 22, borderWidth: 1 },
	tile28: {
		width: 28,
		height: 28,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
	},
});
