import { CheckmarkCircle02Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { LogListItem } from "@/components/ui/log-list-item";
import { OSHeader } from "@/components/ui/os-header";
import { NutritionWidget } from "@/components/widgets/nutrition-widget";
import { NeonColors } from "@/constants/design-system";

export default function NutritionIndex() {
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
							<Text style={styles.viewTitle}>Nutrition</Text>
							<Text style={styles.viewSubtitle}>Tracking your body's fuel and hydration.</Text>
						</View>
						<NutritionWidget />
						<View style={styles.logsList}>
							<LogListItem
								icon={CheckmarkCircle02Icon}
								iconColor={NeonColors.accent.green}
								title="Daily Protein Goal"
								subtitle="120g of 150g consumed"
								value="80%"
								delta="On track"
								deltaColor={NeonColors.text.secondary}
							/>
							<LogListItem
								icon={InformationCircleIcon}
								iconColor={NeonColors.accent.yellow}
								title="Fasting Window"
								subtitle="Intermittent Fasting (16:8)"
								value="Active"
								delta="4h left"
								deltaColor={NeonColors.text.secondary}
							/>
						</View>
					</View>
				</ScrollView>
			</SafeAreaView>
			<FloatingActionButton color={NeonColors.accent.yellow} />
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
