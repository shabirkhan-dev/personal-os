import { Tabs } from "expo-router";
import { BottomNav, SKINCARE_TABS } from "@/components/ui/bottom-nav";

export default function SkincareLayout() {
	return (
		<Tabs tabBar={() => <BottomNav tabs={SKINCARE_TABS} />} screenOptions={{ headerShown: false }}>
			<Tabs.Screen name="index" options={{ title: "Routine" }} />
			<Tabs.Screen name="products" options={{ title: "Products" }} />
			<Tabs.Screen name="history" options={{ title: "History" }} />
		</Tabs>
	);
}
