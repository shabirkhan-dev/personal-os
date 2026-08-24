import { Tabs } from "expo-router";
import { BottomNav, PROFILE_TABS } from "@/components/ui/bottom-nav";

export default function ProfileLayout() {
	return (
		<Tabs tabBar={() => <BottomNav tabs={PROFILE_TABS} />} screenOptions={{ headerShown: false }}>
			<Tabs.Screen name="index" options={{ title: "Profile" }} />
			<Tabs.Screen name="security" options={{ title: "Security" }} />
			<Tabs.Screen name="billing" options={{ title: "Billing" }} />
			<Tabs.Screen name="billing-success" options={{ href: null }} />
			<Tabs.Screen name="billing-cancel" options={{ href: null }} />
		</Tabs>
	);
}
