import { Tabs } from "expo-router";
import { BottomNav, FOCUS_TABS } from "@/components/ui/bottom-nav";

export default function FocusLayout() {
	return (
		<Tabs tabBar={() => <BottomNav tabs={FOCUS_TABS} />} screenOptions={{ headerShown: false }}>
			<Tabs.Screen name="index" options={{ title: "Focus" }} />
			<Tabs.Screen name="tasks" options={{ title: "Tasks" }} />
		</Tabs>
	);
}
