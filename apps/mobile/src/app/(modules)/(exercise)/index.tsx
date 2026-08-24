import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { OSHeader } from "@/components/ui/os-header";
import { HeartRateWidget } from "@/components/widgets/heart-rate-widget";

export default function ExerciseIndex() {
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
								Performance
							</Text>
							<Text className="text-muted-foreground text-sm mt-1">
								Tracking biometric data and physical activity.
							</Text>
						</View>
						<HeartRateWidget />
					</View>
				</ScrollView>
			</SafeAreaView>
		</View>
	);
}
