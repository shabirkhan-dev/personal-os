import { Calendar01Icon, CheckmarkCircle02Icon, Clock01Icon } from "@hugeicons/core-free-icons";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogListItem } from "@/components/ui/log-list-item";
import { OSHeader } from "@/components/ui/os-header";
import { useTheme } from "@/providers/theme-provider";

export default function HistoryScreen() {
	const { colors } = useTheme();
	return (
		<View className="flex-1 bg-background">
			<SafeAreaView edges={["top"]} className="flex-1">
				<OSHeader />

				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ paddingBottom: 40 }}
				>
					<View className="px-4 pt-2">
						<View className="mb-6">
							<Text className="text-foreground text-3xl font-light tracking-tight">History</Text>
							<Text className="text-muted-foreground text-sm mt-1">
								Timeline of past routines and skin progress.
							</Text>
						</View>

						<View className="mt-3">
							<LogListItem
								icon={CheckmarkCircle02Icon}
								iconColor={colors.accent.green}
								title="Morning Routine"
								subtitle="Cleanser → Serum → SPF"
								value="DONE"
								delta="Today, 08:00"
								deltaColor={colors.text.secondary}
							/>
							<LogListItem
								icon={Clock01Icon}
								iconColor={colors.accent.purple}
								title="Night Routine"
								subtitle="Double cleanse → Retinol → Moisturizer"
								value="DONE"
								delta="Yesterday, 22:30"
								deltaColor={colors.text.secondary}
							/>
							<LogListItem
								icon={Calendar01Icon}
								iconColor={colors.accent.blue}
								title="Weekly Mask"
								subtitle="Clay mask — 15 min session"
								value="DONE"
								delta="May 4"
								deltaColor={colors.text.secondary}
							/>
						</View>
					</View>
				</ScrollView>
			</SafeAreaView>
		</View>
	);
}
