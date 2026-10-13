import { Pressable, StyleSheet } from "react-native";
import { PoText } from "@/components/ui/po-text";
import { usePoTheme } from "@/theme";

/** Small surface pill used for "Skip" and "Type instead". */
export function ChipButton({ label, onPress }: { label: string; onPress?: () => void }) {
	const { colors } = usePoTheme();

	return (
		<Pressable
			accessibilityRole="button"
			hitSlop={8}
			onPress={onPress}
			style={({ pressed }) => [
				styles.chip,
				{
					backgroundColor: pressed ? colors.bgHover : colors.bgSurface,
					borderColor: colors.borderDefault,
				},
			]}
		>
			<PoText variant="meta13" tone="textSecondary">
				{label}
			</PoText>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, borderWidth: 1 },
});
