import { Pressable, StyleSheet, Text, View } from "react-native";
import { NeonColors } from "@/constants/design-system";
import type { IconProp } from "./icon";
import { Icon } from "./icon";

interface LogListItemProps {
	icon: IconProp;
	iconColor: string;
	title: string;
	subtitle: string;
	value: string;
	delta?: string;
	deltaColor?: string;
	onPress?: () => void;
}

export function LogListItem({
	icon,
	iconColor,
	title,
	subtitle,
	value,
	delta,
	deltaColor = NeonColors.accent.green,
	onPress,
}: LogListItemProps) {
	return (
		<Pressable
			style={({ pressed }) => [styles.container, { opacity: pressed ? 0.7 : 1 }]}
			onPress={onPress}
		>
			<View style={styles.left}>
				<View style={[styles.iconWrapper, { backgroundColor: `${iconColor}15` }]}>
					<Icon icon={icon} size={20} color={iconColor} strokeWidth={2} />
				</View>
				<View style={styles.textContainer}>
					<Text style={styles.title}>{title}</Text>
					<Text style={styles.subtitle}>{subtitle}</Text>
				</View>
			</View>
			<View style={styles.right}>
				<Text style={styles.value}>{value}</Text>
				{delta && <Text style={[styles.delta, { color: deltaColor }]}>{delta}</Text>}
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 14,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(255, 255, 255, 0.03)",
	},
	left: {
		flexDirection: "row",
		alignItems: "center",
		gap: 16,
	},
	iconWrapper: {
		width: 44,
		height: 44,
		borderRadius: 22,
		justifyContent: "center",
		alignItems: "center",
	},
	textContainer: {
		gap: 2,
	},
	title: {
		color: NeonColors.text.primary,
		fontSize: 16,
		fontWeight: "600",
	},
	subtitle: {
		color: NeonColors.text.secondary,
		fontSize: 13,
		fontWeight: "400",
	},
	right: {
		alignItems: "flex-end",
		gap: 2,
	},
	value: {
		color: NeonColors.text.primary,
		fontSize: 16,
		fontWeight: "600",
		fontFamily: "monospace",
	},
	delta: {
		fontSize: 13,
		fontWeight: "500",
	},
});
