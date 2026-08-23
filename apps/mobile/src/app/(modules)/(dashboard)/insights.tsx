import { Analytics01Icon, FlashIcon, TradeUpIcon } from "@hugeicons/core-free-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogListItem } from "@/components/ui/log-list-item";
import { OSHeader } from "@/components/ui/os-header";
import { NeonColors } from "@/constants/design-system";

export default function InsightsScreen() {
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
							<Text style={styles.viewTitle}>Insights</Text>
							<Text style={styles.viewSubtitle}>AI-powered analysis of your daily patterns.</Text>
						</View>

						<View style={styles.logsList}>
							<LogListItem
								icon={TradeUpIcon}
								iconColor={NeonColors.accent.green}
								title="Weekly Trend"
								subtitle="Consistency up 12% this week"
								value="+12%"
								delta="vs last week"
								deltaColor={NeonColors.text.secondary}
							/>
							<LogListItem
								icon={FlashIcon}
								iconColor={NeonColors.accent.orange}
								title="Peak Energy"
								subtitle="Best performance window detected"
								value="10 AM"
								delta="Optimal"
								deltaColor={NeonColors.accent.green}
							/>
							<LogListItem
								icon={Analytics01Icon}
								iconColor={NeonColors.accent.blue}
								title="Sleep Quality"
								subtitle="REM cycles improving steadily"
								value="87%"
								delta="+3%"
								deltaColor={NeonColors.accent.green}
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
