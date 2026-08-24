import { CheckmarkCircle02Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogListItem } from "@/components/ui/log-list-item";
import { OSHeader } from "@/components/ui/os-header";
import { NutritionWidget } from "@/components/widgets/nutrition-widget";
import { useTheme } from "@/providers/theme-provider";

export default function NutritionIndex() {
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
							<Text className="text-foreground text-3xl font-light tracking-tight">Nutrition</Text>
							<Text className="text-muted-foreground text-sm mt-1">
								Tracking your body's fuel and hydration.
							</Text>
						</View>
						<NutritionWidget />
						<View className="mt-3">
							<LogListItem
								icon={CheckmarkCircle02Icon}
								iconColor={colors.accent.green}
								title="Daily Protein Goal"
								subtitle="120g of 150g consumed"
								value="80%"
								delta="On track"
								deltaColor={colors.text.secondary}
							/>
							<LogListItem
								icon={InformationCircleIcon}
								iconColor={colors.accent.yellow}
								title="Fasting Window"
								subtitle="Intermittent Fasting (16:8)"
								value="Active"
								delta="4h left"
								deltaColor={colors.text.secondary}
							/>
						</View>
					</View>
				</ScrollView>
			</SafeAreaView>
		</View>
	);
}
