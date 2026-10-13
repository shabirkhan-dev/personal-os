import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";
import { Icon } from "@/components/icons";
import { Checkbox } from "@/components/ui/checkbox";
import { PoText } from "@/components/ui/po-text";
import { SelectCard } from "@/components/ui/select-card";
import { SetupFrame } from "@/modules/onboarding/components/setup-frame";
import { onboardingRoutes } from "@/modules/onboarding/lib/flow";
import {
	goalModule,
	goalOptions,
	type ModuleOption,
	moduleOptions,
} from "@/modules/onboarding/lib/options";
import { modulesForGoals, useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { usePoTheme } from "@/theme";

/** 12 Setup 5 · Modules: recommended from the ranked goals, plus optional extras. */
export default function ModulesScreen() {
	const { colors } = usePoTheme();
	const goals = useOnboardingStore((state) => state.goals);
	const modules = useOnboardingStore((state) => state.modules);
	const toggleModule = useOnboardingStore((state) => state.toggleModule);

	const recommendedIds = modulesForGoals(goals);
	const recommended = recommendedIds
		.map((id) => moduleOptions.find((option) => option.id === id))
		.filter((option): option is ModuleOption => option !== undefined);
	const extras = moduleOptions.filter((option) => !recommendedIds.includes(option.id));

	const why = (option: ModuleOption): string => {
		if (option.id === "daily-life") return "Your routine";
		const rank = goals.findIndex((goal) => goalModule[goal] === option.id);
		const goal = goalOptions.find((item) => item.id === goals[rank]);
		return goal ? `Goal ${rank + 1} · ${goal.label.toLowerCase()}` : "Recommended";
	};

	return (
		<SetupFrame
			step={5}
			route={onboardingRoutes.modules}
			title="Your modules"
			body={["Matched to your goals. Turn any on or off."]}
			gap={18}
		>
			<View style={styles.labelRow}>
				<View style={styles.labelLeft}>
					<Icon name="Filled/Sparkle" size={14} color={colors.statusViolet} />
					<PoText variant="eyebrow11" tone="textSecondary">
						Recommended for you
					</PoText>
				</View>
				<PoText variant="eyebrow11" tone="textTertiary">
					{`${modules.length} on`}
				</PoText>
			</View>
			<View style={styles.gap10} />
			<View style={styles.list}>
				{recommended.map((option, index) => {
					const on = modules.includes(option.id);
					return (
						<Animated.View key={option.id} entering={FadeInDown.duration(360).delay(60 * index)}>
							<SelectCard
								selected={on}
								onPress={() => toggleModule(option.id)}
								radius={28}
								accessibilityLabel={option.label}
								style={styles.row}
							>
								<View style={[styles.tile44, { backgroundColor: colors[option.tileTone] }]}>
									<Icon name={option.icon} color={colors[option.iconTone]} />
								</View>
								<View style={styles.text}>
									<View style={styles.nameRow}>
										<PoText variant="row15">{option.label}</PoText>
										<View style={[styles.why, { backgroundColor: colors.bgSurface }]}>
											<PoText variant="eyebrow11" tone="textLink" numberOfLines={1}>
												{why(option)}
											</PoText>
										</View>
									</View>
									<PoText variant="meta13" tone="textSecondary">
										{option.summary}
									</PoText>
								</View>
								<Checkbox checked={on} size={24} />
							</SelectCard>
						</Animated.View>
					);
				})}
			</View>
			{extras.length > 0 ? (
				<>
					<View style={styles.gap16} />
					<View style={styles.labelRow}>
						<PoText variant="eyebrow11" tone="textSecondary">
							More modules
						</PoText>
						<PoText variant="eyebrow11" tone="textTertiary">
							Add anytime
						</PoText>
					</View>
					<View style={styles.gap10} />
					<Animated.View layout={LinearTransition} style={styles.extras}>
						{extras.map((option) => {
							const on = modules.includes(option.id);
							return (
								<Pressable
									key={option.id}
									accessibilityRole="checkbox"
									accessibilityLabel={`Add ${option.label}`}
									accessibilityState={{ checked: on }}
									onPress={() => toggleModule(option.id)}
									style={[
										styles.extra,
										on
											? {
													borderColor: colors.accentDefault,
													borderStyle: "solid",
													borderWidth: 1.5,
												}
											: { borderColor: colors.borderDefault },
									]}
								>
									<View style={[styles.tile40, { backgroundColor: colors[option.tileTone] }]}>
										<Icon name={option.icon} color={colors[option.iconTone]} />
									</View>
									<PoText
										variant="row15"
										tone={on ? "textPrimary" : "textSecondary"}
										style={styles.flex}
										numberOfLines={1}
									>
										{option.label}
									</PoText>
									{on ? (
										<Checkbox checked size={24} />
									) : (
										<View style={[styles.add, { backgroundColor: colors.bgSubtle }]}>
											<Icon name="Filled/Plus" size={16} color={colors.textPrimary} />
										</View>
									)}
								</Pressable>
							);
						})}
					</Animated.View>
				</>
			) : null}
		</SetupFrame>
	);
}

const styles = StyleSheet.create({
	gap10: { height: 10 },
	gap16: { height: 16 },
	flex: { flex: 1 },
	labelRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 6,
	},
	labelLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
	list: { gap: 8 },
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingLeft: 10,
		paddingRight: 14,
		paddingVertical: 10,
	},
	tile44: {
		width: 44,
		height: 44,
		borderRadius: 22,
		alignItems: "center",
		justifyContent: "center",
	},
	tile40: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
	},
	text: { flex: 1, gap: 3 },
	nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
	why: { flexShrink: 1, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
	extras: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
	extra: {
		flexBasis: "47%",
		flexGrow: 1,
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		padding: 8,
		borderRadius: 28,
		borderWidth: 1,
		borderStyle: "dashed",
	},
	add: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
});
