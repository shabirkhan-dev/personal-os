import { Bookmark01Icon, BookOpen01Icon } from "@hugeicons/core-free-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { NeonCard } from "@/components/ui/neon-card";
import { NeonColors } from "@/constants/design-system";

export function LibraryWidget() {
	return (
		<Pressable style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
			<NeonCard accentColor={NeonColors.accent.teal}>
				<View style={styles.header}>
					<View style={styles.headerLeft}>
						<Icon icon={BookOpen01Icon} size={20} color={NeonColors.accent.teal} />
						<Text style={styles.title}>Currently Reading</Text>
					</View>
					<Text style={styles.subtitle}>2 Books</Text>
				</View>

				<View style={styles.bookContainer}>
					<View style={styles.bookCover}>
						<Icon icon={Bookmark01Icon} size={24} color={NeonColors.background} />
					</View>
					<View style={styles.bookInfo}>
						<Text style={styles.bookTitle}>Atomic Habits</Text>
						<Text style={styles.bookAuthor}>James Clear</Text>
						<View style={styles.progressContainer}>
							<View style={styles.progressBar}>
								<View style={[styles.progressFill, { width: "70%" }]} />
							</View>
							<Text style={styles.progressText}>70%</Text>
						</View>
					</View>
				</View>

				<View style={styles.statsContainer}>
					<View style={styles.statItem}>
						<Icon icon={Bookmark01Icon} size={16} color={NeonColors.text.secondary} />
						<Text style={styles.statValue}>14</Text>
						<Text style={styles.statLabel}>Completed</Text>
					</View>
					<View style={styles.divider} />
					<View style={styles.statItem}>
						<Icon icon={BookOpen01Icon} size={16} color={NeonColors.text.secondary} />
						<Text style={styles.statValue}>32</Text>
						<Text style={styles.statLabel}>Wishlist</Text>
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
	bookContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 16,
		marginVertical: 8,
	},
	bookCover: {
		width: 60,
		height: 80,
		backgroundColor: NeonColors.accent.teal,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
	},
	bookInfo: {
		flex: 1,
	},
	bookTitle: {
		color: NeonColors.text.primary,
		fontSize: 16,
		fontWeight: "600",
		marginBottom: 4,
	},
	bookAuthor: {
		color: NeonColors.text.secondary,
		fontSize: 14,
		marginBottom: 12,
	},
	progressContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	progressBar: {
		flex: 1,
		height: 6,
		backgroundColor: "rgba(255,255,255,0.1)",
		borderRadius: 3,
		overflow: "hidden",
	},
	progressFill: {
		height: "100%",
		backgroundColor: NeonColors.accent.teal,
		borderRadius: 3,
	},
	progressText: {
		color: NeonColors.accent.teal,
		fontSize: 12,
		fontWeight: "600",
	},
	statsContainer: {
		flexDirection: "row",
		justifyContent: "space-around",
		alignItems: "center",
		marginTop: 20,
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
