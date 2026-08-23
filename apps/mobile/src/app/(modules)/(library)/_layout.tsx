import { Bookmark01Icon, LibraryIcon } from "@hugeicons/core-free-icons";
import { Tabs } from "expo-router";
import { Icon } from "@/components/ui/icon";
import { NeonColors } from "@/constants/design-system";

export default function LibraryLayout() {
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarStyle: {
					backgroundColor: NeonColors.background,
					borderTopColor: "rgba(255, 255, 255, 0.05)",
					height: 84,
					paddingBottom: 24,
				},
				tabBarActiveTintColor: NeonColors.accent.teal,
				tabBarInactiveTintColor: NeonColors.text.muted,
				tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Dashboard",
					tabBarIcon: ({ color, focused }) => (
						<Icon icon={LibraryIcon} color={color} size={22} strokeWidth={focused ? 2.5 : 1.5} />
					),
				}}
			/>
			<Tabs.Screen
				name="books"
				options={{
					title: "Books",
					tabBarIcon: ({ color, focused }) => (
						<Icon icon={Bookmark01Icon} color={color} size={22} strokeWidth={focused ? 2.5 : 1.5} />
					),
				}}
			/>
		</Tabs>
	);
}
