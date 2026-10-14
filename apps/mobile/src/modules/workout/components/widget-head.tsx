import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon, type IconName } from "@/components/icons";
import { PoText } from "@/components/ui/po-text";
import { usePoTheme } from "@/theme";
import { haptics } from "@/lib/haptics";

export type WidgetHeadProps = {
	icon: IconName;
	label: string;
	/** Right side: a chevron, a range pill… */
	right?: ReactNode;
	/** Makes the whole head a button. */
	onPress?: () => void;
	accessibilityLabel?: string;
};

/** Kit v2 widget head: 40px subtle circle with a glyph, secondary label, optional accessory. */
export function WidgetHead({ icon, label, right, onPress, accessibilityLabel }: WidgetHeadProps) {
	const { colors } = usePoTheme();
	const content = (
		<>
			<View style={[styles.circle, { backgroundColor: colors.bgSubtle }]}>
				<Icon name={icon} color={colors.textPrimary} />
			</View>
			<PoText variant="body15" tone="textSecondary" style={styles.label}>
				{label}
			</PoText>
			{right}
		</>
	);
	if (!onPress) return <View style={styles.head}>{content}</View>;
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel ?? label}
			onPress={() => {
				haptics.tap();
				onPress();
			}}
			style={styles.head}
		>
			{content}
		</Pressable>
	);
}

const styles = StyleSheet.create({
	head: { flexDirection: "row", alignItems: "center", gap: 12 },
	circle: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
	},
	label: { flex: 1 },
});
