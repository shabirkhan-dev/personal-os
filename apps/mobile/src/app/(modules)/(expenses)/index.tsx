import { ShoppingBag01Icon } from "@hugeicons/core-free-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { LogListItem } from "@/components/ui/log-list-item";
import { OSHeader } from "@/components/ui/os-header";
import { SpendingWidget } from "@/components/widgets/spending-widget";
import { NeonColors } from "@/constants/design-system";

export default function ExpensesIndex() {
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
							<Text style={styles.viewTitle}>Capital</Text>
							<Text style={styles.viewSubtitle}>Monitoring daily spend and financial health.</Text>
						</View>
						<SpendingWidget />
						<View style={styles.logsList}>
							<LogListItem
								icon={ShoppingBag01Icon}
								iconColor={NeonColors.accent.orange}
								title="Groceries"
								subtitle="Whole Foods Market"
								value="$78.46"
								delta="Today"
								deltaColor={NeonColors.text.secondary}
							/>
						</View>
					</View>
				</ScrollView>
			</SafeAreaView>
			<FloatingActionButton color={NeonColors.accent.orange} />
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
