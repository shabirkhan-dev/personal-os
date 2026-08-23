import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from "react-native";
import { useTheme } from "@/providers/theme-provider";

interface AuthButtonProps {
	label: string;
	onPress: () => void;
	pending?: boolean;
	disabled?: boolean;
	variant?: "primary" | "outline" | "ghost";
	style?: ViewStyle;
}

export function AuthButton({
	label,
	onPress,
	pending = false,
	disabled = false,
	variant = "primary",
	style,
}: AuthButtonProps) {
	const { colors, isDark } = useTheme();
	const isDisabled = disabled || pending;

	return (
		<Pressable
			onPress={onPress}
			disabled={isDisabled}
			style={({ pressed }) => [
				styles.base,
				variant === "primary" && [styles.primary, { backgroundColor: colors.accent.green }],
				variant === "outline" && [
					styles.outline,
					{
						borderColor: colors.card.border,
						backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
					},
				],
				variant === "ghost" && styles.ghost,
				pressed && !isDisabled && styles.pressed,
				isDisabled && styles.disabled,
				style,
			]}
		>
			{pending ? (
				<ActivityIndicator color={variant === "primary" ? "#000000" : colors.accent.green} />
			) : (
				<Text
					style={[
						styles.label,
						variant === "primary" && styles.primaryLabel,
						variant !== "primary" && [styles.secondaryLabel, { color: colors.text.primary }],
					]}
				>
					{label}
				</Text>
			)}
		</Pressable>
	);
}

const styles = StyleSheet.create({
	base: {
		minHeight: 48,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 16,
	},
	primary: {},
	outline: {
		borderWidth: 1,
	},
	ghost: {
		backgroundColor: "transparent",
	},
	pressed: {
		opacity: 0.85,
	},
	disabled: {
		opacity: 0.5,
	},
	label: {
		fontSize: 16,
		fontWeight: "700",
	},
	primaryLabel: {
		color: "#000000",
	},
	secondaryLabel: {},
});
