import { Tabs } from "expo-router";
import { BottomNav, ROUTINES_TABS } from "@/components/ui/bottom-nav";

export default function RoutinesLayout() {
	return (
		<Tabs tabBar={() => <BottomNav tabs={ROUTINES_TABS} />} screenOptions={{ headerShown: false }}>
			<Tabs.Screen name="index" options={{ title: "Today" }} />
			<Tabs.Screen name="habits" options={{ title: "Habits" }} />
		</Tabs>
	);
}
