import { Tabs } from "expo-router";
import { BookOpen, Brain } from "lucide-react-native";
import { NeonColors } from "@/constants/design-system";

export default function MindfulnessLayout() {
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarStyle: {
					backgroundColor: NeonColors.background,
					borderTopColor: "rgba(255, 255, 255, 0.05)",
					height: 84,
					paddingBottom: 24,
				},
				tabBarActiveTintColor: NeonColors.accent.cyan,
				tabBarInactiveTintColor: NeonColors.text.muted,
				tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Clarity",
					tabBarIcon: ({ color, focused }) => (
						<Brain color={color} size={22} strokeWidth={focused ? 2.5 : 1.5} />
					),
				}}
			/>
			<Tabs.Screen
				name="journal"
				options={{
					title: "Journal",
					tabBarIcon: ({ color, focused }) => (
						<BookOpen color={color} size={22} strokeWidth={focused ? 2.5 : 1.5} />
					),
				}}
			/>
		</Tabs>
	);
}
