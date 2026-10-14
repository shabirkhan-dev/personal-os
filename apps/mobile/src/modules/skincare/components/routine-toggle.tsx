import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import type { RoutineKind } from "../lib/skincare-types";

export type RoutineToggleProps = {
	value: RoutineKind;
	onChange: (value: RoutineKind) => void;
};

const OPTIONS = [
	{ value: "morning", label: "Morning", icon: "Sun" },
	{ value: "night", label: "Night", icon: "Moon" },
] as const;

/** Morning / Night switch: bg/surface track, accent pill on the chosen routine. */
export function RoutineToggle({ value, onChange }: RoutineToggleProps) {
	const { colors } = usePoTheme();
	return (
		<View
			accessibilityRole="radiogroup"
			accessibilityLabel="Routine"
			style={[
				styles.track,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			{OPTIONS.map((option) => {
				const active = option.value === value;
				const tone = active ? "textOnAccent" : "textSecondary";
				return (
					<Pressable
						key={option.value}
						accessibilityRole="radio"
						accessibilityLabel={`${option.label} routine`}
						accessibilityState={{ selected: active }}
						onPress={() => {
							if (!active) haptics.select();
							onChange(option.value);
						}}
						style={[styles.segment, active ? { backgroundColor: colors.accentDefault } : null]}
					>
						<Icon name={option.icon} size={16} color={colors[tone]} />
						<PoText variant="row15" tone={tone}>
							{option.label}
						</PoText>
					</Pressable>
				);
			})}
		</View>
	);
}

const styles = StyleSheet.create({
	track: { flexDirection: "row", gap: 4, padding: 4, borderRadius: 28, borderWidth: 1 },
	segment: {
		flex: 1,
		height: 44,
		borderRadius: 22,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
	},
});
