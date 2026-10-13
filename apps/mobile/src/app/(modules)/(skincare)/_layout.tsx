import { Tabs } from "expo-router";
import { History, ShoppingBag, Sparkles } from "lucide-react-native";
import { NeonColors } from "@/constants/design-system";

export default function SkincareLayout() {
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
				tabBarActiveTintColor: NeonColors.accent.purple,
				tabBarInactiveTintColor: NeonColors.text.muted,
				tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Routine",
					tabBarIcon: ({ color, focused }) => (
						<Sparkles color={color} size={22} strokeWidth={focused ? 2.5 : 1.5} />
					),
				}}
			/>
			<Tabs.Screen
				name="products"
				options={{
					title: "Products",
					tabBarIcon: ({ color, focused }) => (
						<ShoppingBag color={color} size={22} strokeWidth={focused ? 2.5 : 1.5} />
					),
				}}
			/>
			<Tabs.Screen
				name="history"
				options={{
					title: "History",
					tabBarIcon: ({ color, focused }) => (
						<History color={color} size={22} strokeWidth={focused ? 2.5 : 1.5} />
					),
				}}
			/>
		</Tabs>
	);
}
