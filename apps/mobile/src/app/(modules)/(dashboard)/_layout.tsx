import { Tabs } from "expo-router";
import { BottomNav } from "@/components/ui/bottom-nav";

export default function DashboardLayout() {
	return (
		<Tabs
			tabBar={() => <BottomNav />}
			screenOptions={{
				headerShown: false,
			}}
		>
			<Tabs.Screen name="index" options={{ title: "Home" }} />
			<Tabs.Screen name="insights" options={{ title: "Insights" }} />
		</Tabs>
	);
}
