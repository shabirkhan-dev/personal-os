import { Tabs } from "expo-router";
import { BottomNav, NUTRITION_TABS } from "@/components/ui/bottom-nav";

export default function NutritionLayout() {
	return (
		<Tabs tabBar={() => <BottomNav tabs={NUTRITION_TABS} />} screenOptions={{ headerShown: false }}>
			<Tabs.Screen name="index" options={{ title: "Diet" }} />
			<Tabs.Screen name="meals" options={{ title: "Meals" }} />
		</Tabs>
	);
}
