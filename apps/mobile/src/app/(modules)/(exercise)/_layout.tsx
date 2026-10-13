import { Tabs } from "expo-router";
import { Activity, Dumbbell } from "lucide-react-native";
import { NeonColors } from "@/constants/design-system";

export default function ExerciseLayout() {
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
				tabBarActiveTintColor: NeonColors.accent.blue,
				tabBarInactiveTintColor: NeonColors.text.muted,
				tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Performance",
					tabBarIcon: ({ color, focused }) => (
						<Dumbbell color={color} size={22} strokeWidth={focused ? 2.5 : 1.5} />
					),
				}}
			/>
			<Tabs.Screen
				name="records"
				options={{
					title: "Records",
					tabBarIcon: ({ color, focused }) => (
						<Activity color={color} size={22} strokeWidth={focused ? 2.5 : 1.5} />
					),
				}}
			/>
		</Tabs>
	);
}
