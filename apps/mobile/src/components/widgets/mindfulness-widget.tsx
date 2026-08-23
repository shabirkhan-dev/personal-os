import { Brain01Icon, FavouriteIcon, Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { NeonCard } from "@/components/ui/neon-card";
import { NeonColors } from "@/constants/design-system";

export function MindfulnessWidget() {
	return (
		<Pressable style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
			<NeonCard>
				<View style={styles.header}>
					<View style={styles.iconContainer}>
						<Icon icon={Brain01Icon} size={20} color={NeonColors.accent.cyan} />
					</View>
					<Text style={styles.title}>Mental Clarity</Text>
					<Text style={styles.subtitle}>Optimum</Text>
				</View>

				<View style={styles.statsRow}>
					<View style={styles.statBox}>
						<Icon icon={Sun03Icon} size={20} color={NeonColors.accent.yellow} />
						<Text style={styles.statValue}>15m</Text>
						<Text style={styles.statLabel}>Meditation</Text>
					</View>

					<View style={styles.divider} />

					<View style={styles.statBox}>
						<Icon icon={FavouriteIcon} size={20} color={NeonColors.accent.red} />
						<Text style={styles.statValue}>Calm</Text>
						<Text style={styles.statLabel}>Avg Mood</Text>
					</View>

					<View style={styles.divider} />

					<View style={styles.statBox}>
						<Icon icon={Moon02Icon} size={20} color={NeonColors.accent.purple} />
						<Text style={styles.statValue}>7h 45m</Text>
						<Text style={styles.statLabel}>Deep Sleep</Text>
					</View>
				</View>
			</NeonCard>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	header: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 24,
	},
	iconContainer: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "rgba(24, 255, 255, 0.1)",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 12,
	},
	title: {
		color: NeonColors.text.primary,
		fontSize: 16,
		fontWeight: "600",
		flex: 1,
	},
	subtitle: {
		color: NeonColors.accent.cyan,
		fontSize: 14,
		fontWeight: "700",
	},
	statsRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 4,
	},
	statBox: {
		alignItems: "center",
		gap: 8,
		flex: 1,
	},
	divider: {
		width: 1,
		height: 40,
		backgroundColor: "rgba(255, 255, 255, 0.1)",
	},
	statValue: {
		color: NeonColors.text.primary,
		fontSize: 15,
		fontWeight: "700",
	},
	statLabel: {
		color: NeonColors.text.secondary,
		fontSize: 11,
		fontWeight: "500",
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
});
