import { Pressable, StyleSheet, View } from "react-native";
import { Icon, type IconName } from "@/components/icons";
import { usePoTheme } from "@/theme";
import { haptics } from "@/lib/haptics";

export type HeaderButtonProps = {
	icon?: IconName;
	onPress?: () => void;
	/** Shows the unread dot (Kit v2 Badge=On). */
	badge?: boolean;
	accessibilityLabel: string;
};

/** Kit v2 "Header Button": round 40px surface button with a 20px glyph. */
export function HeaderButton({
	icon = "Filled/Back",
	onPress,
	badge = false,
	accessibilityLabel,
}: HeaderButtonProps) {
	const { colors } = usePoTheme();

	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel}
			hitSlop={8}
			onPress={
				onPress
					? () => {
							haptics.tap();
							onPress();
						}
					: undefined
			}
			style={({ pressed }) => [
				styles.button,
				{
					backgroundColor: pressed ? colors.bgHover : colors.bgSurface,
					borderColor: colors.borderDefault,
				},
			]}
		>
			<Icon name={icon} size={20} color={colors.textPrimary} />
			{badge ? (
				<View
					style={[
						styles.badge,
						{ backgroundColor: colors.accentDefault, borderColor: colors.bgApp },
					]}
				/>
			) : null}
		</Pressable>
	);
}

const styles = StyleSheet.create({
	button: {
		width: 40,
		height: 40,
		borderRadius: 20,
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	badge: {
		position: "absolute",
		top: 0,
		right: 0,
		width: 12,
		height: 12,
		borderRadius: 6,
		borderWidth: 2,
	},
});
