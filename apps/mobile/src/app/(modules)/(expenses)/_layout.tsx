import { Tabs } from "expo-router";
import { List, PieChart, Wallet } from "lucide-react-native";
import { NeonColors } from "@/constants/design-system";

export default function ExpensesLayout() {
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
				tabBarActiveTintColor: NeonColors.accent.orange,
				tabBarInactiveTintColor: NeonColors.text.muted,
				tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Capital",
					tabBarIcon: ({ color, focused }) => (
						<Wallet color={color} size={22} strokeWidth={focused ? 2.5 : 1.5} />
					),
				}}
			/>
			<Tabs.Screen
				name="transactions"
				options={{
					title: "Logs",
					tabBarIcon: ({ color, focused }) => (
						<List color={color} size={22} strokeWidth={focused ? 2.5 : 1.5} />
					),
				}}
			/>
			<Tabs.Screen
				name="budget"
				options={{
					title: "Budget",
					tabBarIcon: ({ color, focused }) => (
						<PieChart color={color} size={22} strokeWidth={focused ? 2.5 : 1.5} />
					),
				}}
			/>
		</Tabs>
	);
}
