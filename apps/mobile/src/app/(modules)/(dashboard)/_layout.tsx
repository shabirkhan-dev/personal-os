import { Tabs } from "expo-router";
import { LayoutDashboard, Zap } from "lucide-react-native";
import { NeonColors } from "@/constants/design-system";

export default function DashboardLayout() {
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
				tabBarActiveTintColor: NeonColors.accent.green,
				tabBarInactiveTintColor: NeonColors.text.muted,
				tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Home",
					tabBarIcon: ({ color, focused }) => (
						<LayoutDashboard color={color} size={22} strokeWidth={focused ? 2.5 : 1.5} />
					),
				}}
			/>
			<Tabs.Screen
				name="insights"
				options={{
					title: "Insights",
					tabBarIcon: ({ color, focused }) => (
						<Zap color={color} size={22} strokeWidth={focused ? 2.5 : 1.5} />
					),
				}}
			/>
		</Tabs>
	);
}
