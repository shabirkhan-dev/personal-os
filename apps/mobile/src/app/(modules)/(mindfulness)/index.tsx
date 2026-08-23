import { HeadphonesIcon, Pulse01Icon } from "@hugeicons/core-free-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { LogListItem } from "@/components/ui/log-list-item";
import { OSHeader } from "@/components/ui/os-header";
import { MindfulnessWidget } from "@/components/widgets/mindfulness-widget";
import { NeonColors } from "@/constants/design-system";

export default function MindfulnessIndex() {
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
							<Text style={styles.viewTitle}>Mindfulness</Text>
							<Text style={styles.viewSubtitle}>Tracking mental clarity and emotional state.</Text>
						</View>
						<MindfulnessWidget />
						<View style={styles.logsList}>
							<LogListItem
								icon={Pulse01Icon}
								iconColor={NeonColors.accent.cyan}
								title="Morning Meditation"
								subtitle="Guided breathing exercise"
								value="DONE"
								delta="07:30 AM"
								deltaColor={NeonColors.text.secondary}
							/>
							<LogListItem
								icon={HeadphonesIcon}
								iconColor={NeonColors.accent.purple}
								title="Deep Focus Session"
								subtitle="Binaural beats, uninterrupted"
								value="45 min"
								delta="Completed"
								deltaColor={NeonColors.accent.green}
							/>
						</View>
					</View>
				</ScrollView>
			</SafeAreaView>
			<FloatingActionButton color={NeonColors.accent.cyan} />
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
