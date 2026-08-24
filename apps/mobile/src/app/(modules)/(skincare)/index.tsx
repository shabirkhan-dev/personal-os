import { SparklesIcon } from "@hugeicons/core-free-icons";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogListItem } from "@/components/ui/log-list-item";
import { OSHeader } from "@/components/ui/os-header";
import { SkincareWidget } from "@/components/widgets/skincare-widget";
import { useTheme } from "@/providers/theme-provider";

export default function SkincareIndex() {
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
							<Text className="text-foreground text-3xl font-light tracking-tight">
								Skin Health
							</Text>
							<Text className="text-muted-foreground text-sm mt-1">
								Managing your daily dermatological routine.
							</Text>
						</View>
						<SkincareWidget />
						<View className="mt-3">
							<LogListItem
								icon={SparklesIcon}
								iconColor={colors.accent.purple}
								title="Face Wash"
								subtitle="Completed morning set"
								value="DONE"
								delta="08:00 AM"
								deltaColor={colors.text.secondary}
							/>
						</View>
					</View>
				</ScrollView>
			</SafeAreaView>
		</View>
	);
}
