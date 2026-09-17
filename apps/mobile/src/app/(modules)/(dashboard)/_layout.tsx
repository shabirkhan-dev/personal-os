import { ChatBotIcon } from "@hugeicons/core-free-icons";
import { router, Tabs } from "expo-router";
import { BottomNav } from "@/components/ui/bottom-nav";

export default function DashboardLayout() {
	return (
		<Tabs
			tabBar={() => (
				<BottomNav
					onAddPress={() => router.push("/(modules)/(dashboard)/chat" as never)}
					addIcon={ChatBotIcon}
					addAccessibilityLabel="Personal OS Assistant"
				/>
			)}
			screenOptions={{
				headerShown: false,
			}}
		>
			<Tabs.Screen name="index" options={{ title: "Home" }} />
			<Tabs.Screen name="insights" options={{ title: "Insights" }} />
			<Tabs.Screen name="chat" options={{ title: "Assistant", href: null }} />
		</Tabs>
	);
}
