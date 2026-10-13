import { Tabs } from "expo-router";
import { PieChart, Utensils } from "lucide-react-native";
import { NeonColors } from "@/constants/design-system";

export default function NutritionLayout() {
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
				tabBarActiveTintColor: NeonColors.accent.yellow,
				tabBarInactiveTintColor: NeonColors.text.muted,
				tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Diet",
					tabBarIcon: ({ color, focused }) => (
						<PieChart color={color} size={22} strokeWidth={focused ? 2.5 : 1.5} />
					),
				}}
			/>
			<Tabs.Screen
				name="meals"
				options={{
					title: "Meals",
					tabBarIcon: ({ color, focused }) => (
						<Utensils color={color} size={22} strokeWidth={focused ? 2.5 : 1.5} />
					),
				}}
			/>
		</Tabs>
	);
}
