import { Tabs } from "expo-router";
import { BottomNav, EXERCISE_TABS } from "@/components/ui/bottom-nav";

export default function ExerciseLayout() {
	return (
		<Tabs tabBar={() => <BottomNav tabs={EXERCISE_TABS} />} screenOptions={{ headerShown: false }}>
			<Tabs.Screen name="index" options={{ title: "Performance" }} />
			<Tabs.Screen name="records" options={{ title: "Records" }} />
		</Tabs>
	);
}
