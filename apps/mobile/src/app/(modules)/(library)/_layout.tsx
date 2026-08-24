import { Tabs } from "expo-router";
import { BottomNav, LIBRARY_TABS } from "@/components/ui/bottom-nav";

export default function LibraryLayout() {
	return (
		<Tabs tabBar={() => <BottomNav tabs={LIBRARY_TABS} />} screenOptions={{ headerShown: false }}>
			<Tabs.Screen name="index" options={{ title: "Library" }} />
			<Tabs.Screen name="books" options={{ title: "Books" }} />
		</Tabs>
	);
}
