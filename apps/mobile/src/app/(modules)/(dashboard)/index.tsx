import {
	CheckmarkCircle02Icon,
	CoffeeIcon,
	DropletIcon,
	FlashIcon,
	Mic01Icon,
	TradeUpIcon,
} from "@hugeicons/core-free-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { Icon } from "@/components/ui/icon";
import { LogListItem } from "@/components/ui/log-list-item";
import { OSHeader } from "@/components/ui/os-header";
import { QuickAction } from "@/components/ui/quick-action";
import { HeartRateWidget } from "@/components/widgets/heart-rate-widget";
import { MindfulnessWidget } from "@/components/widgets/mindfulness-widget";
import { NutritionWidget } from "@/components/widgets/nutrition-widget";
import { RecorderWidget } from "@/components/widgets/recorder-widget";
import { SpendingWidget } from "@/components/widgets/spending-widget";
import { WaterWidget } from "@/components/widgets/water-widget";
import { NeonColors } from "@/constants/design-system";

export default function DashboardIndex() {
	return (
		<View style={styles.container}>
			<SafeAreaView edges={["top"]} style={styles.safeArea}>
				<OSHeader />

				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={styles.scrollContent}
				>
					{/* Status Section */}
					<View style={styles.statusSection}>
						<Text style={styles.statusLabel}>SYSTEM READINESS</Text>
						<View style={styles.scoreRow}>
							<Text style={styles.score}>
								94.2<Text style={styles.scorePercent}>%</Text>
							</Text>
							<View style={styles.trendBadge}>
								<Icon icon={TradeUpIcon} size={12} color={NeonColors.accent.green} />
								<Text style={styles.trendText}>+2.4%</Text>
							</View>
						</View>
					</View>

					{/* Quick Actions */}
					<View style={styles.quickActionsRow}>
						<QuickAction icon={FlashIcon} label="Workout" />
						<QuickAction icon={DropletIcon} label="Log Water" />
						<QuickAction icon={Mic01Icon} label="Record" />
						<QuickAction icon={CoffeeIcon} label="Mood" />
					</View>

					{/* Vital Signs Carousel */}
					<View style={styles.sectionHeader}>
						<Text style={styles.sectionTitle}>VITAL SIGNS</Text>
					</View>

					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.carouselContent}
						snapToAlignment="center"
						decelerationRate="fast"
					>
						<View style={styles.widgetWrapper}>
							<WaterWidget />
						</View>
						<View style={styles.widgetWrapper}>
							<HeartRateWidget />
						</View>
						<View style={styles.widgetWrapper}>
							<SpendingWidget />
						</View>
						<View style={styles.widgetWrapper}>
							<RecorderWidget />
						</View>
						<View style={styles.widgetWrapper}>
							<NutritionWidget />
						</View>
						<View style={styles.widgetWrapper}>
							<MindfulnessWidget />
						</View>
					</ScrollView>

					{/* Recent Activity */}
					<View style={styles.sectionHeader}>
						<Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
					</View>

					<View style={styles.logsList}>
						<LogListItem
							icon={CheckmarkCircle02Icon}
							iconColor={NeonColors.accent.green}
							title="Design System"
							subtitle="Architecture finalized"
							value="DONE"
							delta="Just now"
							deltaColor={NeonColors.text.secondary}
						/>
					</View>
				</ScrollView>
			</SafeAreaView>
			<FloatingActionButton color={NeonColors.accent.green} />
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
	statusSection: {
		paddingHorizontal: 16,
		marginTop: 12,
		marginBottom: 20,
	},
	statusLabel: {
		color: NeonColors.text.secondary,
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 1.5,
		marginBottom: 4,
	},
	scoreRow: {
		flexDirection: "row",
		alignItems: "baseline",
		gap: 12,
	},
	score: {
		color: NeonColors.text.primary,
		fontSize: 48,
		fontWeight: "300",
	},
	scorePercent: {
		fontSize: 24,
		color: NeonColors.text.secondary,
	},
	trendBadge: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		backgroundColor: "rgba(0, 230, 118, 0.15)",
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 12,
	},
	trendText: {
		color: NeonColors.accent.green,
		fontSize: 12,
		fontWeight: "700",
	},
	quickActionsRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		marginBottom: 32,
	},
	sectionHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 16,
		marginBottom: 16,
	},
	sectionTitle: {
		color: NeonColors.text.primary,
		fontSize: 14,
		fontWeight: "700",
		letterSpacing: 1,
	},
	carouselContent: {
		paddingLeft: 16,
		paddingRight: 16,
		gap: 12,
		marginBottom: 32,
	},
	widgetWrapper: {
		width: 320,
	},
	logsList: {
		paddingHorizontal: 16,
		marginTop: 12,
	},
});
