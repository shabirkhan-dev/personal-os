import { Calendar01Icon, CheckmarkCircle02Icon, Clock01Icon } from "@hugeicons/core-free-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogListItem } from "@/components/ui/log-list-item";
import { OSHeader } from "@/components/ui/os-header";
import { NeonColors } from "@/constants/design-system";

export default function HistoryScreen() {
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
							<Text style={styles.viewTitle}>History</Text>
							<Text style={styles.viewSubtitle}>Timeline of past routines and skin progress.</Text>
						</View>

						<View style={styles.logsList}>
							<LogListItem
								icon={CheckmarkCircle02Icon}
								iconColor={NeonColors.accent.green}
								title="Morning Routine"
								subtitle="Cleanser → Serum → SPF"
								value="DONE"
								delta="Today, 08:00"
								deltaColor={NeonColors.text.secondary}
							/>
							<LogListItem
								icon={Clock01Icon}
								iconColor={NeonColors.accent.purple}
								title="Night Routine"
								subtitle="Double cleanse → Retinol → Moisturizer"
								value="DONE"
								delta="Yesterday, 22:30"
								deltaColor={NeonColors.text.secondary}
							/>
							<LogListItem
								icon={Calendar01Icon}
								iconColor={NeonColors.accent.blue}
								title="Weekly Mask"
								subtitle="Clay mask — 15 min session"
								value="DONE"
								delta="May 4"
								deltaColor={NeonColors.text.secondary}
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
