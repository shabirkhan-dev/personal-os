import { Tabs } from "expo-router";
import { BottomNav, MINDFULNESS_TABS } from "@/components/ui/bottom-nav";

export default function MindfulnessLayout() {
	return (
		<Tabs
			tabBar={() => <BottomNav tabs={MINDFULNESS_TABS} />}
			screenOptions={{ headerShown: false }}
		>
			<Tabs.Screen name="index" options={{ title: "Clarity" }} />
			<Tabs.Screen name="journal" options={{ title: "Journal" }} />
		</Tabs>
	);
}
