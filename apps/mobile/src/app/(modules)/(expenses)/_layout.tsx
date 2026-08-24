import { Tabs } from "expo-router";
import { BottomNav, FINANCE_TABS } from "@/components/ui/bottom-nav";

export default function ExpensesLayout() {
	return (
		<Tabs tabBar={() => <BottomNav tabs={FINANCE_TABS} />} screenOptions={{ headerShown: false }}>
			<Tabs.Screen name="index" options={{ title: "Capital" }} />
			<Tabs.Screen name="transactions" options={{ title: "Logs" }} />
			<Tabs.Screen name="budget" options={{ title: "Budgets" }} />
		</Tabs>
	);
}
