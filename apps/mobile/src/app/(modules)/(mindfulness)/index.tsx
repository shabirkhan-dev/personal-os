import { HeadphonesIcon, Pulse01Icon } from "@hugeicons/core-free-icons";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogListItem } from "@/components/ui/log-list-item";
import { OSHeader } from "@/components/ui/os-header";
import { MindfulnessWidget } from "@/components/widgets/mindfulness-widget";
import { useTheme } from "@/providers/theme-provider";

export default function MindfulnessIndex() {
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
								Mindfulness
							</Text>
							<Text className="text-muted-foreground text-sm mt-1">
								Tracking mental clarity and emotional state.
							</Text>
						</View>
						<MindfulnessWidget />
						<View className="mt-3">
							<LogListItem
								icon={Pulse01Icon}
								iconColor={colors.accent.cyan}
								title="Morning Meditation"
								subtitle="Guided breathing exercise"
								value="DONE"
								delta="07:30 AM"
								deltaColor={colors.text.secondary}
							/>
							<LogListItem
								icon={HeadphonesIcon}
								iconColor={colors.accent.purple}
								title="Deep Focus Session"
								subtitle="Binaural beats, uninterrupted"
								value="45 min"
								delta="Completed"
								deltaColor={colors.accent.green}
							/>
						</View>
					</View>
				</ScrollView>
			</SafeAreaView>
		</View>
	);
}
