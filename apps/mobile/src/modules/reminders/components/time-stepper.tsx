import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import { clockLabel } from "../lib/reminder-settings";

const DAY = 24 * 60;

/** A time with − / + buttons in 15-minute steps, for a reminder row. */
export function TimeStepper({
	label,
	minutes,
	onChange,
	step = 15,
}: {
	label: string;
	minutes: number;
	onChange: (minutes: number) => void;
	step?: number;
}) {
	const { colors } = usePoTheme();
	const move = (by: number) => {
		haptics.tap();
		onChange((((minutes + by) % DAY) + DAY) % DAY);
	};
	return (
		<View style={styles.row}>
			<PoText variant="meta13" tone="textSecondary" style={styles.label}>
				{label}
			</PoText>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={`${label} earlier`}
				onPress={() => move(-step)}
				style={[styles.button, { backgroundColor: colors.bgSubtle }]}
			>
				<Icon name="Minus" size={16} color={colors.textPrimary} />
			</Pressable>
			<PoText
				variant="title18"
				style={styles.time}
				accessibilityLabel={`${label} ${clockLabel(minutes)}`}
			>
				{clockLabel(minutes)}
			</PoText>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={`${label} later`}
				onPress={() => move(step)}
				style={[styles.button, { backgroundColor: colors.bgSubtle }]}
			>
				<Icon name="Filled/Plus" size={16} color={colors.textPrimary} />
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	row: { flexDirection: "row", alignItems: "center", gap: 10 },
	label: { flex: 1, minWidth: 0 },
	button: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: "center",
		justifyContent: "center",
	},
	time: { minWidth: 56, textAlign: "center", fontVariant: ["tabular-nums"] },
});
