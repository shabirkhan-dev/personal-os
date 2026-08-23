import { Menu01Icon, PieChartIcon, Wallet01Icon } from "@hugeicons/core-free-icons";
import { Tabs } from "expo-router";
import { Icon } from "@/components/ui/icon";
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
