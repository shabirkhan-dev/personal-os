import { Menu01Icon, PieChartIcon, Wallet01Icon } from "@hugeicons/core-free-icons";
import { Tabs } from "expo-router";
import { Icon } from "@/components/ui/icon";

export default function ExpensesLayout() {
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarStyle: {
					backgroundColor: "#0B0C10",
					borderTopColor: "rgba(255, 255, 255, 0.08)",
					height: 64,
					paddingBottom: 12,
					paddingTop: 8,
				},
				tabBarActiveTintColor: "#FFFFFF",
				tabBarInactiveTintColor: "#888888",
				tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Capital",
					tabBarIcon: ({ color, focused }) => (
						<Icon icon={Wallet01Icon} color={color} size={22} strokeWidth={focused ? 2.5 : 1.5} />
					),
				}}
			/>
			<Tabs.Screen
				name="transactions"
				options={{
					title: "Logs",
					tabBarIcon: ({ color, focused }) => (
						<Icon icon={Menu01Icon} color={color} size={22} strokeWidth={focused ? 2.5 : 1.5} />
					),
				}}
			/>
			<Tabs.Screen
				name="budget"
				options={{
					title: "Budget",
					tabBarIcon: ({ color, focused }) => (
						<Icon icon={PieChartIcon} color={color} size={22} strokeWidth={focused ? 2.5 : 1.5} />
					),
				}}
			/>
		</Tabs>
	);
}
