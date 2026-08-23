import { AppleIcon, Bread01Icon, FireIcon, NaturalFoodIcon } from "@hugeicons/core-free-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { NeonCard } from "@/components/ui/neon-card";
import { NeonColors, NeonShadows } from "@/constants/design-system";

export function NutritionWidget() {
	return (
		<Pressable style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
			<NeonCard>
				<View style={styles.header}>
					<View style={styles.iconContainer}>
						<Icon icon={FireIcon} size={20} color={NeonColors.accent.yellow} />
					</View>
					<Text style={styles.title}>Daily Macros</Text>
					<Text style={styles.subtitle}>1,450 / 2,200 kcal</Text>
				</View>

				<View style={styles.progressContainer}>
					<View style={styles.progressBarBg}>
						<View style={[styles.progressBarFill, { width: "65%" }]} />
					</View>
				</View>

				<View style={styles.macrosRow}>
					<View style={styles.macroItem}>
						<Icon icon={NaturalFoodIcon} size={18} color={NeonColors.accent.red} />
						<Text style={styles.macroValue}>120g</Text>
						<Text style={styles.macroLabel}>Protein</Text>
					</View>
					<View style={styles.macroItem}>
						<Icon icon={Bread01Icon} size={18} color={NeonColors.accent.orange} />
						<Text style={styles.macroValue}>160g</Text>
						<Text style={styles.macroLabel}>Carbs</Text>
					</View>
					<View style={styles.macroItem}>
						<Icon icon={AppleIcon} size={18} color={NeonColors.accent.green} />
						<Text style={styles.macroValue}>45g</Text>
						<Text style={styles.macroLabel}>Fats</Text>
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
		marginBottom: 20,
	},
	iconContainer: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "rgba(255, 234, 0, 0.1)",
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
		color: NeonColors.accent.yellow,
		fontSize: 14,
		fontWeight: "700",
	},
	progressContainer: {
		marginBottom: 24,
	},
	progressBarBg: {
		height: 8,
		backgroundColor: "rgba(255, 255, 255, 0.1)",
		borderRadius: 4,
		overflow: "hidden",
	},
	progressBarFill: {
		height: "100%",
		backgroundColor: NeonColors.accent.yellow,
		borderRadius: 4,
		...NeonShadows.glow,
		shadowColor: NeonColors.accent.yellow,
	},
	macrosRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingHorizontal: 8,
	},
	macroItem: {
		alignItems: "center",
		gap: 6,
	},
	macroValue: {
		color: NeonColors.text.primary,
		fontSize: 16,
		fontWeight: "700",
	},
	macroLabel: {
		color: NeonColors.text.secondary,
		fontSize: 12,
		fontWeight: "500",
	},
});
