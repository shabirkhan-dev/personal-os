import { AlertCircleIcon, PiggyBankIcon, Target01Icon } from "@hugeicons/core-free-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogListItem } from "@/components/ui/log-list-item";
import { OSHeader } from "@/components/ui/os-header";
import { NeonColors } from "@/constants/design-system";

export default function BudgetScreen() {
	return (
		<View style={styles.container}>
			<SafeAreaView edges={["top"]} style={styles.safeArea}>
				<OSHeader />

				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={styles.scrollContent}
				>
					<View style={styles.viewContainer}>
						<View style={styles.viewHeader}>
							<Text style={styles.viewTitle}>Budget</Text>
							<Text style={styles.viewSubtitle}>Spending limits and savings goals overview.</Text>
						</View>

						<View style={styles.logsList}>
							<LogListItem
								icon={Target01Icon}
								iconColor={NeonColors.accent.blue}
								title="Monthly Target"
								subtitle="$1,200 of $2,000 remaining"
								value="60%"
								delta="On track"
								deltaColor={NeonColors.accent.green}
							/>
							<LogListItem
								icon={PiggyBankIcon}
								iconColor={NeonColors.accent.green}
								title="Savings Goal"
								subtitle="Emergency fund progress"
								value="$8,420"
								delta="84%"
								deltaColor={NeonColors.accent.green}
							/>
							<LogListItem
								icon={AlertCircleIcon}
								iconColor={NeonColors.accent.orange}
								title="Food & Dining"
								subtitle="Category nearing limit"
								value="$380/$400"
								delta="95%"
								deltaColor={NeonColors.accent.red}
							/>
						</View>
					</View>
				</ScrollView>
			</SafeAreaView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: NeonColors.background,
	},
	safeArea: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 40,
	},
	viewContainer: {
		paddingHorizontal: 16,
		paddingTop: 8,
	},
	viewHeader: {
		marginBottom: 24,
	},
	viewTitle: {
		color: NeonColors.text.primary,
		fontSize: 32,
		fontWeight: "300",
	},
	viewSubtitle: {
		color: NeonColors.text.secondary,
		fontSize: 14,
		marginTop: 4,
	},
	logsList: {
		marginTop: 12,
	},
});
