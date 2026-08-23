import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { NeonColors, NeonShadows } from "@/constants/design-system";

interface FloatingActionButtonProps {
	onPress?: () => void;
	color?: string;
}

export function FloatingActionButton({
	onPress,
	color = NeonColors.accent.green,
}: FloatingActionButtonProps) {
	return (
		<View style={styles.container}>
			<Pressable
				onPress={onPress}
				style={({ pressed }) => [
					styles.button,
					{ backgroundColor: color, shadowColor: color },
					pressed && styles.pressed,
				]}
			>
				<Icon icon={PlusSignIcon} size={32} color={NeonColors.background} strokeWidth={2.5} />
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		position: "absolute",
		bottom: 104, // Above the bottom nav
		right: 24,
		zIndex: 999,
	},
	button: {
		width: 64,
		height: 64,
		borderRadius: 32,
		justifyContent: "center",
		alignItems: "center",
		...NeonShadows.glow,
	},
	pressed: {
		transform: [{ scale: 0.92 }],
		opacity: 0.9,
	},
});
