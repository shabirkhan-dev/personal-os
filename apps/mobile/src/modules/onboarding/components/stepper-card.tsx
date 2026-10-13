import type { ColorTokens } from "@personal-os/tokens";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Icon, type IconName } from "@/components/icons";
import { PoText } from "@/components/ui/po-text";
import { usePoTheme } from "@/theme";
import { haptics } from "@/lib/haptics";

export type StepperCardProps = {
	label: string;
	value: string;
	icon: IconName;
	iconTone: keyof ColorTokens;
	tileTone: keyof ColorTokens;
	stepLabel: string;
	onDecrement: () => void;
	onIncrement: () => void;
};

/** Wake-up / Sleep card: icon + label, PO 30 time and a ±15 min stepper. */
export function StepperCard({
	label,
	value,
	icon,
	iconTone,
	tileTone,
	stepLabel,
	onDecrement,
	onIncrement,
}: StepperCardProps) {
	const { colors } = usePoTheme();

	return (
		<View
			style={[
				styles.card,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			<View style={styles.top}>
				<View style={[styles.tile, { backgroundColor: colors[tileTone] }]}>
					<Icon name={icon} size={16} color={colors[iconTone]} />
				</View>
				<PoText variant="meta13" tone="textSecondary">
					{label}
				</PoText>
			</View>
			<Animated.View key={value} entering={FadeIn.duration(160)}>
				<PoText variant="title30">{value}</PoText>
			</Animated.View>
			<View style={styles.stepper}>
				<RoundButton icon="Minus" label={`${label} earlier`} onPress={onDecrement} />
				<PoText variant="mono13" tone="textTertiary">
					{stepLabel}
				</PoText>
				<RoundButton icon="Filled/Plus" label={`${label} later`} onPress={onIncrement} />
			</View>
		</View>
	);
}

function RoundButton({
	icon,
	label,
	onPress,
}: {
	icon: IconName;
	label: string;
	onPress: () => void;
}) {
	const { colors } = usePoTheme();
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={label}
			hitSlop={6}
			onPress={() => {
				haptics.select();
				onPress();
			}}
			style={({ pressed }) => [
				styles.round,
				{ backgroundColor: pressed ? colors.bgSelected : colors.bgSubtle },
			]}
		>
			<Icon name={icon} size={16} color={colors.textPrimary} />
		</Pressable>
	);
}

const styles = StyleSheet.create({
	card: {
		flex: 1,
		gap: 12,
		paddingTop: 16,
		paddingBottom: 12,
		paddingHorizontal: 16,
		borderRadius: 28,
		borderWidth: 1,
	},
	top: { flexDirection: "row", alignItems: "center", gap: 10 },
	tile: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
	stepper: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
	round: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: "center",
		justifyContent: "center",
	},
});
