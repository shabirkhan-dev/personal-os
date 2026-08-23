import { CheckmarkCircle02Icon, Clock01Icon, Target01Icon } from "@hugeicons/core-free-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { NeonCard } from "@/components/ui/neon-card";
import { NeonColors } from "@/constants/design-system";

export function FocusWidget() {
	return (
		<Pressable style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
			<NeonCard accentColor={NeonColors.accent.pink}>
				<View style={styles.header}>
					<View style={styles.headerLeft}>
						<Icon icon={Target01Icon} size={20} color={NeonColors.accent.pink} />
						<Text style={styles.title}>Deep Work</Text>
					</View>
					<Text style={styles.subtitle}>Pomodoro</Text>
				</View>

				<View style={styles.timerContainer}>
					<View style={styles.timerCircle}>
						<Text style={styles.timerText}>25:00</Text>
						<Text style={styles.timerLabel}>Focus Time</Text>
					</View>
				</View>

				<View style={styles.statsContainer}>
					<View style={styles.statItem}>
						<Icon icon={Clock01Icon} size={16} color={NeonColors.text.secondary} />
						<Text style={styles.statValue}>2.5h</Text>
						<Text style={styles.statLabel}>Today</Text>
					</View>
					<View style={styles.divider} />
					<View style={styles.statItem}>
						<Icon icon={CheckmarkCircle02Icon} size={16} color={NeonColors.text.secondary} />
						<Text style={styles.statValue}>4</Text>
						<Text style={styles.statLabel}>Sessions</Text>
					</View>
				</View>
			</NeonCard>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 20,
	},
	headerLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	title: {
		color: NeonColors.text.primary,
		fontSize: 18,
		fontWeight: "600",
	},
	subtitle: {
		color: NeonColors.text.secondary,
		fontSize: 14,
	},
	timerContainer: {
		alignItems: "center",
		marginVertical: 16,
	},
	timerCircle: {
		width: 140,
		height: 140,
		borderRadius: 70,
		borderWidth: 4,
		borderColor: NeonColors.accent.pink,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(255,0,127,0.05)",
	},
	timerText: {
		color: NeonColors.text.primary,
		fontSize: 32,
		fontWeight: "700",
		fontVariant: ["tabular-nums"],
	},
	timerLabel: {
		color: NeonColors.accent.pink,
		fontSize: 12,
		marginTop: 4,
		fontWeight: "600",
	},
	statsContainer: {
		flexDirection: "row",
		justifyContent: "space-around",
		alignItems: "center",
		marginTop: 16,
		paddingTop: 16,
		borderTopWidth: 1,
		borderTopColor: "rgba(255, 255, 255, 0.05)",
	},
	statItem: {
		alignItems: "center",
		gap: 4,
	},
	statValue: {
		color: NeonColors.text.primary,
		fontSize: 16,
		fontWeight: "600",
	},
	statLabel: {
		color: NeonColors.text.secondary,
		fontSize: 12,
	},
	divider: {
		width: 1,
		height: 24,
		backgroundColor: "rgba(255, 255, 255, 0.1)",
	},
});
