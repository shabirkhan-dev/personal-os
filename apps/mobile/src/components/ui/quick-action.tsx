import { Pressable, StyleSheet, Text, View } from "react-native";
import { NeonColors } from "@/constants/design-system";
import type { IconProp } from "./icon";
import { Icon } from "./icon";

interface QuickActionProps {
	icon: IconProp;
	label: string;
	onPress?: () => void;
}

export function QuickAction({ icon, label, onPress }: QuickActionProps) {
	return (
		<Pressable style={styles.container} onPress={onPress}>
			<View style={styles.iconWrapper}>
				<Icon icon={icon} size={24} color={NeonColors.text.primary} strokeWidth={1.5} />
			</View>
			<Text style={styles.label}>{label}</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	container: {
		alignItems: "center",
		gap: 8,
		width: 72,
	},
	iconWrapper: {
		width: 60,
		height: 60,
		borderRadius: 20,
		backgroundColor: NeonColors.surface,
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.05)",
	},
	label: {
		color: NeonColors.text.secondary,
		fontSize: 12,
		fontWeight: "500",
		textAlign: "center",
	},
});
